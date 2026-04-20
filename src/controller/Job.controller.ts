import { Request, Response } from 'express';
import mongoose from 'mongoose';
import JobModel from '../models/job.model.js';
import FileModel from '../models/file.model.js';
import { JobService } from '../services/job.service.js';
import { fileZipSchema } from '../Validation/zipFileValidation.js';
import { parseError } from '../utils/parseError.js';

export class JobCtr {
  // create zip creation job
  static createZipJob = async (req: Request, res: Response) => {
    try {
      // Extract and validate projectId
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Validate request body (fileIds)
      const result = fileZipSchema.validate(req.body);
      if (result.error || !result.value) {
        return res.status(400).json({
          error: result.error?.message || 'Add files',
        });
      }

      const { fileIds } = result.value;

      // Fetch only valid files belonging to this project
      const selectedFiles = await FileModel.find({
        _id: { $in: fileIds },
        projectId,
      });

      // Ensure at least one valid file exists
      if (selectedFiles.length === 0) {
        return res.status(404).json({
          error: 'No valid files found for this project',
        });
      }

      // Create a new job entry before processing
      const job = await JobModel.create({
        projectId,
        status: 'PROCESSING',
        startedAt: new Date(),
      });

      // Trigger background zip creation (non-blocking)
      JobService.createZip({
        job,
        projectId,
        selectedFiles,
      });

      res.status(202).json({
        message: 'Zip job started',
        jobId: job._id,
      });
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // get all zipped files based on project id
  static getZipsDetailsList = async (req: Request, res: Response) => {
    try {
      const { projectId: projectId } = req.params as { projectId: string };

      // Validate projectId before querying
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Fetch all zip jobs/files for the project
      const zips = await JobService.listZips(projectId);

      res.status(200).json(zips);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // check job status of zip file based on job-id
  static getJobStatus = async (req: Request, res: Response) => {
    try {
      const { jobId, projectId } = req.params as {
        jobId: string;
        projectId: string;
      };

      // Validate projectId and jobId
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ error: 'Invalid Job ID format' });
      }

      // Fetch job status fields only (optimized query)
      const job = await JobModel.findById(jobId).select('status progress size');

      // Handle job not found case
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Return job progress/state
      res.status(200).json(job);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // download zip with job-ID
  static downloadZip = async (req: Request, res: Response) => {
    try {
      const { jobId, projectId } = req.params as {
        jobId: string;
        projectId: string;
      };

      // Validate projectId before download
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Service handles file streaming to response
      await JobService.downloadZip(jobId, res);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // Delete Zip job
  static deleteZipJob = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params as { jobId: string };

      // Call service to delete zip job and related data
      const result = await JobService.deleteZipJob(jobId);

      return res.status(200).json(result);
    } catch (err) {
      const { message, status } = parseError(err);
      return res.status(status).json({ error: message });
    }
  };
}
