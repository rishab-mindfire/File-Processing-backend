import mongoose from 'mongoose';
import { Readable } from 'stream';
import FileModel from '../models/fileModel';
import { fileSchema } from '../Validation/fileValidation';

export class FileService {
  //  Upload files
  static async uploadFiles(projectId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw { status: 400, message: 'No files uploaded' };
    }

    // Validate files
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

      if (!file.buffer || file.buffer.length === 0) {
        throw {
          status: 400,
          message: `File ${file.originalname} is empty`,
        };
      }
    }

    const db = mongoose.connection.db;
    if (!db) throw { status: 500, message: 'Database not connected' };

    const bucket = new mongoose.mongo.GridFSBucket(db);
    const uploadPromises = files.map((file) => {
      return new Promise(async (resolve, reject) => {
        try {
          const stream = new Readable();
          stream.push(file.buffer);
          stream.push(null);

          const uploadStream = bucket.openUploadStream(file.originalname);

          stream
            .pipe(uploadStream)
            .on('error', reject)
            .on('finish', async () => {
              try {
                const metadata = await FileModel.create({
                  projectId,
                  name: file.originalname,
                  fileId: uploadStream.id,
                  size: file.size,
                  mimeType: file.mimetype,
                });

                resolve(metadata);
              } catch (err) {
                reject(err);
              }
            });
        } catch (err) {
          reject(err);
        }
      });
    });

    return await Promise.all(uploadPromises);
  }

  //  List files
  static async listFiles(projectId: string) {
    return await FileModel.find({ projectId }).sort({ createdAt: -1 });
  }

  //  Download file (stream)
  static async streamFile(fileId: string, res: any) {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      throw { status: 400, message: 'Invalid fileId' };
    }

    const objectId = new mongoose.Types.ObjectId(fileId);

    const fileDoc = await FileModel.findOne({ fileId: objectId });
    if (!fileDoc) {
      throw { status: 404, message: 'File not found' };
    }

    const db = mongoose.connection.db;
    if (!db) throw { status: 500, message: 'DB not connected' };

    const bucket = new mongoose.mongo.GridFSBucket(db);

    // Headers
    res.setHeader(
      'Content-Type',
      fileDoc.mimeType || 'application/octet-stream',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileDoc.name}"`,
    );

    const downloadStream = bucket.openDownloadStream(objectId);

    downloadStream.on('error', (err) => {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found in storage' });
      }
    });

    downloadStream.pipe(res);
  }
}
