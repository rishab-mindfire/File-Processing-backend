import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Response } from 'express';
import FileModel from '../models/fileModel';
import { fileSchema } from '../Validation/fileValidation';

const FILES_DIR = path.resolve(
  process.env.UPLOAD_PATH_FILES || './uploads/files',
);

const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[Storage] Created directory: ${dirPath}`);
  }
};

// create folder upload/files
ensureDirectoryExists(FILES_DIR);

export class FileService {
  // upload files
  static async uploadFiles(projectId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw { status: 400, message: 'No files uploaded' };
    }

    // check directory created or not
    ensureDirectoryExists(FILES_DIR);

    // Validate files before upload
    for (const file of files) {
      const { error } = fileSchema.validate({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      if (error) {
        throw {
          status: 400,
          message: `Invalid file ${file.originalname}: ${error.message}`,
        };
      }
    }

    const uploadPromises = files.map(async (file) => {
      // Create unique filename
      const uniqueName = `${Date.now()}-${file.originalname}`;
      const storagePath = path.join(FILES_DIR, uniqueName);

      // Write to disk
      await fs.promises.writeFile(storagePath, file.buffer);

      return await FileModel.create({
        projectId,
        name: file.originalname,
        storagePath: storagePath,
        size: file.size,
        mimeType: file.mimetype,
        isGenerated: false,
      });
    });

    return await Promise.all(uploadPromises);
  }

  static async listFiles(projectId: string) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw { status: 400, message: 'Invalid Project ID' };
    }

    return await FileModel.find({ projectId })
      .select('name size')
      .sort({ createdAt: -1 })
      .lean();
  }

  // download file based on file id
  static async downloadFile(fileId: string, res: Response) {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      throw { status: 400, message: 'Invalid fileId' };
    }

    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc) throw { status: 404, message: 'File not found' };

    if (!fs.existsSync(fileDoc.storagePath)) {
      throw { status: 404, message: 'Physical file missing from storage' };
    }

    res.setHeader(
      'Content-Type',
      fileDoc.mimeType || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileDoc.name}"`,
    );

    const readStream = fs.createReadStream(fileDoc.storagePath);
    readStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Stream failure' });
    });

    readStream.pipe(res);
  }
}
