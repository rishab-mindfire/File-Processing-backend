import { Request, Response } from 'express';
import { FileService } from '../services/fileService';

export class fileCtr {
  // upload files based on project id
  static uploadFiles = async (req: Request, res: Response) => {
    try {
      const { id: projectId } = req.params as { id: string };
      const files = req.files as Express.Multer.File[];

      const results = await FileService.uploadFiles(projectId, files);

      res.status(201).json({
        message: 'Files stored successfully',
        data: results,
      });
    } catch (error: any) {
      console.error('Upload error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };

  // list files based on project ID
  static listFiles = async (req: Request, res: Response) => {
    try {
      const { id: projectId } = req.params as { id: string };

      const files = await FileService.listFiles(projectId);

      res.status(200).json(files);
    } catch (error: any) {
      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };
  // download files
  static downloadFile = async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params as { fileId: string };

      await FileService.downloadFile(fileId, res);
    } catch (error: any) {
      console.error('Download error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };
}
