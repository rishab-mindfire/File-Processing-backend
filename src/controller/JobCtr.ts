import { Request, Response } from 'express';
import mongoose from 'mongoose';
import JobModel from '../models/jobModel';
import FileModel from '../models/fileModel';
import { JobService } from '../services/jobService';
import { fileZipSchema } from '../Validation/zipFileValidation';

export class JobCtr {
  // create zip creation job
  static createZipJob = async (req: Request, res: Response) => {
    try {
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      //Validate input files
      const result = fileZipSchema.validate(req.body);
      if (result.error || !result.value) {
        return res.status(400).json({
          error: result.error?.message || 'Add files',
        });
      }

      const { fileIds } = result.value;

      // Fetch valid files FIRST
      const selectedFiles = await FileModel.find({
        _id: { $in: fileIds },
        projectId,
      });

      if (selectedFiles.length === 0) {
        return res.status(404).json({
          error: 'No valid files found for this project',
        });
      }

      // Create job ONLY if valid files exist
      const job = await JobModel.create({
        projectId,
        status: 'PROCESSING',
        startedAt: new Date(),
      });

      // Start background worker
      JobService.createZip({
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

  // get all ziped project based on project id
  static getZipsDetailsList = async (req: Request, res: Response) => {
    try {
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      const zips = await JobService.listZips(projectId);
      res.status(200).json(zips);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };

  // check job status of zip file based on job-id form db
  static getJobStatus = async (req: Request, res: Response) => {
    try {
      const { jobId, projectId } = req.params as {
        jobId: string;
        projectId: string;
      };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

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

  // download zip with job-ID
  static downloadZip = async (req: Request, res: Response) => {
    try {
      const { jobId, projectId } = req.params as {
        jobId: string;
        projectId: string;
      };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      await JobService.downloadZip(jobId, res);
    } catch (error: any) {
      console.error('Download error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };
}
