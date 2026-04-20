import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import FileModel from '../models/file.model';
import { fileSchema } from '../Validation/fileValidation';

const FILES_DIR = path.resolve(
  process.env.UPLOAD_PATH_FILES || './uploads/files'
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
    // check file
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
  // list fileDetails
  static async listFiles(projectId: string) {
    return await FileModel.find({ projectId })
      .select('name size')
      .sort({ createdAt: -1 })
      .lean();
  }
  // delete file by fileId
  static async deleteFile(fileId: string) {
    // Find file in DB
    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc) {
      throw { status: 404, message: 'File not found' };
    }

    //  Delete physical file (if exists)
    try {
      const fullPath = path.resolve(fileDoc.storagePath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        console.log('Deleted file from disk:', fullPath);
      } else {
        console.warn('File not found on disk:', fullPath);
      }
    } catch (err) {
      console.error('Error deleting file from disk:', err);
    }

    // Delete DB record
    await FileModel.findByIdAndDelete(fileId);

    return { message: 'File deleted successfully' };
  }
  // download file based on file id
  static async downloadFile(
    requestParam: { fileId: string; projectId: string },
    res: Response
  ) {
    const { fileId, projectId } = requestParam;

    // Fetch ONLY if file belongs to project
    const fileDoc = await FileModel.findOne({
      _id: fileId,
      projectId: projectId,
    });
    if (!fileDoc) {
      throw { status: 404, message: 'File not found for this project' };
    }

    // Check physical file
    if (!fs.existsSync(fileDoc.storagePath)) {
      throw { status: 404, message: 'Physical file missing from storage' };
    }

    // Headers
    res.setHeader(
      'Content-Type',
      fileDoc.mimeType || 'application/octet-stream'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileDoc.name}"`
    );

    // Stream
    const readStream = fs.createReadStream(fileDoc.storagePath);

    readStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream failure' });
      }
    });

    readStream.pipe(res);
  }
}
