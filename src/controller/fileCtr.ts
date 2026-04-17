import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import ProjectModel from '../models/projectModel';
import mongoose from 'mongoose';

export class fileCtr {
  // upload files based on project id
  static uploadFiles = async (req: Request, res: Response) => {
    try {
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.json({ status: 400, message: 'Project not found' });
      }

      const files = req.files as Express.Multer.File[];
      const upload = await FileService.uploadFiles(projectId, files);
      const safeFiles = upload.map((file) => ({
        name: file.name,
        size: file.size,
      }));

      res.status(200).json({
        message: 'Files stored successfully',
        data: safeFiles,
      });
    } catch (error: any) {
      console.error('Upload error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };

  // list files based on project ID
  static getFileDetailsList = async (req: Request, res: Response) => {
    try {
      const { projectId: projectId } = req.params as { projectId: string };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.json({ status: 400, message: 'Project not found' });
      }

      const files = await FileService.listFiles(projectId);

      res.status(200).json(files);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };

  // delete file
  static deleteFile = async (req: Request, res: Response) => {
    try {
      const { fileId, projectId } = req.params as {
        fileId: string;
        projectId: string;
      };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      const result = await FileService.deleteFile(fileId);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Delete file error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };

  // download files
  static downloadFile = async (req: Request, res: Response) => {
    try {
      const { fileId, projectId } = req.params as {
        fileId: string;
        projectId: string;
      };
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid projectId' });
      }

      await FileService.downloadFile({ fileId, projectId }, res);
    } catch (error: any) {
      console.error('Download error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };
}
