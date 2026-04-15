import { Request, Response } from 'express';
import mongoose from 'mongoose';
import JobModel from '../models/jobModel';
import FileModel from '../models/fileModel';
import { JobService } from '../services/jobService';
import { fileZipSchema } from '../Validation/zipFileValidation';

export class JobCtr {
  static createZipJob = async (req: Request, res: Response) => {
    try {
      const { id: projectId } = req.params as { id: string };
      const result = fileZipSchema.validate(req.body);

      if (result.error || !result.value) {
        return res.status(400).json({
          error: result.error?.message || 'Add files',
        });
      }

      const { fileIds } = result.value;

      const job = await JobModel.create({
        projectId,
        status: 'PROCESSING',
        startedAt: new Date(),
      });

      const selectedFiles = await FileModel.find({
        fileId: { $in: fileIds },
        projectId,
      });

      if (selectedFiles.length === 0) {
        await JobModel.findByIdAndUpdate(job._id, {
          status: 'FAILED',
          error: 'No valid files found',
        });

        return res.status(404).json({ error: 'No files found' });
      }

      // process with selected files zip-workers
      JobService.startZipWorker({
        job,
        projectId,
        selectedFiles,
      });

      res.status(202).json({
        message: 'Zip job started',
        jobId: job._id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  static getJobStatus = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params as { jobId: string };

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ error: 'Invalid Job ID format' });
      }

      // Fetch Job by job-id
      const job = await JobModel.findById(jobId);

      // Handle Not Found
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      // Return Job state
      res.status(200).json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  static downloadZip = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params as { jobId: string };

      await JobService.streamZipToResponse(jobId, res);
    } catch (error: any) {
      console.error('Download error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };
}
