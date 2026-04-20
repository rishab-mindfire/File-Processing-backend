import { Request, Response } from 'express';
import { FileService } from '../services/file.service.js';
import ProjectModel from '../models/project.model.js';
import mongoose from 'mongoose';
import { parseError } from '../utils/parseError.js';
import { singleFile } from '../types/index.js';

export class fileCtr {
  // upload files based on project id
  static uploadFiles = async (req: Request, res: Response) => {
    try {
      // Extract projectId from route params
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Ensure project exists before uploading any files
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.json({ status: 400, message: 'Project not found' });
      }

      // Get uploaded files from multer middleware
      const files = req.files as Express.Multer.File[];

      // Delegate upload logic to service layer
      const upload = await FileService.uploadFiles(projectId, files);

      // Return only safe/required fields to client
      const safeFiles = upload.map((file: singleFile) => ({
        name: file.name,
        size: file.size,
        _id: file._id,
      }));

      res.status(200).json({
        message: 'Files stored successfully',
        data: safeFiles,
      });
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // list files based on project ID
  static getFileDetailsList = async (req: Request, res: Response) => {
    try {
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Check if project exists to avoid unnecessary file queries
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.json({ status: 400, message: 'Project not found' });
      }

      // Fetch file list from service layer
      const files = await FileService.listFiles(projectId);

      res.status(200).json(files);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // delete file
  static deleteFile = async (req: Request, res: Response) => {
    try {
      const { fileId, projectId } = req.params as {
        fileId: string;
        projectId: string;
      };

      // Validate projectId before delete operation
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Call service to delete file (handles DB + storage)
      const result = await FileService.deleteFile(fileId);

      return res.status(200).json(result);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // download files
  static downloadFile = async (req: Request, res: Response) => {
    try {
      const { fileId, projectId } = req.params as {
        fileId: string;
        projectId: string;
      };

      // Validate projectId before download
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      // Service handles streaming file to response
      await FileService.downloadFile({ fileId, projectId }, res);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };
}
