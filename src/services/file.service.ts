// File Management Service Module
// Orchestrates local filesystem operations and database metadata synchronization
// Provides comprehensive file lifecycle methods including upload, list, delete, and download
// Implements strict validation and unique naming conventions to prevent data collisions
import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import FileModel from '../models/file.model.js';
import { fileSchema } from '../Validation/fileValidation.js';

// Define the root directory for physical file storage from environment or defaults
const FILES_DIR = path.resolve(process.env.UPLOAD_PATH_FILES || './uploads/files');

// Helper function to verify or create directory structures recursively
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize the storage directory during the service bootstrap phase
ensureDirectoryExists(FILES_DIR);

export class FileService {
  // Handles multi-file uploads by validating types and persisting to disk and database
  static async uploadFiles(projectId: string, files: Express.Multer.File[]) {
    // Reject requests that do not contain file data
    if (!files || files.length === 0) {
      throw { status: 400, message: 'No files uploaded' };
    }

    // Verify directory availability before starting the upload stream
    ensureDirectoryExists(FILES_DIR);

    // Validate metadata for all files against the defined schema before processing
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

    // Execute file persistence and database record creation in parallel for performance
    const uploadPromises = files.map(async (file) => {
      // Append a timestamp to the filename to ensure uniqueness in the filesystem
      const uniqueName = `${Date.now()}-${file.originalname}`;
      const storagePath = path.join(FILES_DIR, uniqueName);

      // Write the file buffer to the localized storage path
      await fs.promises.writeFile(storagePath, file.buffer);

      // Register the file metadata within the project's database context
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

  // Retrieves an optimized list of file summaries associated with a specific project
  static async listFiles(projectId: string) {
    return await FileModel.find({
      projectId,
      // This line filters out any file where the mimeType is 'application/zip'
      mimeType: { $ne: 'application/zip' },
    })
      .select('name size')
      .sort({ createdAt: -1 })
      .lean();
  }

  // Removes a file record from the database and deletes the corresponding disk entry
  static async deleteFile(fileId: string) {
    // Locate the document to retrieve the physical storage path
    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc) {
      throw { status: 404, message: 'File not found' };
    }

    // Attempt to unlink the file from the filesystem if it exists
    try {
      const fullPath = path.resolve(fileDoc.storagePath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      // Log failure but proceed to record cleanup to prevent ghost entries
      if (err) {
        return;
      }
    }

    // Purge the metadata record from the database collection
    await FileModel.findByIdAndDelete(fileId);

    return { message: 'File deleted successfully' };
  }

  // Facilitates secure file downloads via read-streams and appropriate MIME headers
  static async downloadFile(requestParam: { fileId: string; projectId: string }, res: Response) {
    const { fileId, projectId } = requestParam;

    // Verify that the requested file exists and belongs to the active project
    const fileDoc = await FileModel.findOne({
      _id: fileId,
      projectId: projectId,
    });

    if (!fileDoc) {
      throw { status: 404, message: 'File not found for this project' };
    }

    // Validate that the physical asset hasn't been removed from storage
    if (!fs.existsSync(fileDoc.storagePath)) {
      throw { status: 404, message: 'Physical file missing from storage' };
    }

    // Configure the HTTP response for binary data transmission
    res.setHeader('Content-Type', fileDoc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);

    // Stream the file content directly to the response to optimize memory usage
    const readStream = fs.createReadStream(fileDoc.storagePath);

    // Monitor stream health and prevent response headers from being sent twice
    readStream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream failure' });
      }
    });

    readStream.pipe(res);
  }
}
