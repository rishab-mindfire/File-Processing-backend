import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import FileModel from '../models/file.model.js';
import { fileSchema } from '../Validation/fileValidation.js';

// Resolve upload directory
const FILES_DIR = path.resolve(process.env.UPLOAD_PATH_FILES || './uploads/files');

// Ensure directory exists before using it
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create base upload directory at startup
ensureDirectoryExists(FILES_DIR);

export class FileService {
  // upload files
  static async uploadFiles(projectId: string, files: Express.Multer.File[]) {
    // Validate files array
    if (!files || files.length === 0) {
      throw { status: 400, message: 'No files uploaded' };
    }

    // Ensure storage directory exists
    ensureDirectoryExists(FILES_DIR);

    // Validate each file using schema
    for (const file of files) {
      const { error } = fileSchema.validate({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      if (error) {
        throw {
          status: 400,
          message: `Invalid file ${file.originalname}: ${error.message.replace(/[\\"]/g, '')}`,
        };
      }
    }

    // Process uploads in parallel
    const uploadPromises = files.map(async (file) => {
      // Generate unique filename to avoid conflicts
      const uniqueName = `${Date.now()}-${file.originalname}`;
      const storagePath = path.join(FILES_DIR, uniqueName);

      // Save file to disk
      await fs.promises.writeFile(storagePath, file.buffer);

      // Store metadata in DB
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

  // list file details
  static async listFiles(projectId: string) {
    return await FileModel.find({ projectId }).select('name size').sort({ createdAt: -1 }).lean();
  }

  // delete file by fileId
  static async deleteFile(fileId: string) {
    // Find file in DB
    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc) {
      throw { status: 404, message: 'File not found' };
    }

    // Delete physical file if it exists
    try {
      const fullPath = path.resolve(fileDoc.storagePath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      if (err) {
        return;
      }
    }

    // Remove DB record
    await FileModel.findByIdAndDelete(fileId);

    return { message: 'File deleted successfully' };
  }

  // download file based on file id
  static async downloadFile(requestParam: { fileId: string; projectId: string }, res: Response) {
    const { fileId, projectId } = requestParam;

    // Ensure file belongs to given project
    const fileDoc = await FileModel.findOne({
      _id: fileId,
      projectId: projectId,
    });

    if (!fileDoc) {
      throw { status: 404, message: 'File not found for this project' };
    }

    // Check if file exists on disk
    if (!fs.existsSync(fileDoc.storagePath)) {
      throw { status: 404, message: 'Physical file missing from storage' };
    }

    // Set response headers for file download
    res.setHeader('Content-Type', fileDoc.mimeType || 'application/octet-stream');

    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);

    // Stream file to response
    const readStream = fs.createReadStream(fileDoc.storagePath);

    readStream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream failure' });
      }
    });

    readStream.pipe(res);
  }
}
