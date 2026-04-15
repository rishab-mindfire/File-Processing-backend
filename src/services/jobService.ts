import { Worker } from 'worker_threads';
import mongoose from 'mongoose';
import FileModel from '../models/fileModel';
import JobModel from '../models/jobModel';
import path from 'path';
import { Response } from 'express';

export class JobService {
  static startZipWorker({
    job,
    projectId,
    selectedFiles,
  }: {
    job: any;
    projectId: string;
    selectedFiles: any[];
  }) {
    const workerPath = path.resolve(__dirname, '../workers/zip-Worker.js');

    const worker = new Worker(workerPath, {
      workerData: {
        jobId: job._id.toString(),
        projectId,
        dbUri: process.env.DB_CONNECTION_STRING,
        files: selectedFiles.map((f) => ({
          name: f.name,
          fileId: f.fileId.toString(),
        })),
      },
    });

    //  Handle messages
    worker.on('message', async (msg) => {
      if (msg.type === 'DONE') {
        const newFile = await FileModel.create({
          projectId,
          name: msg.name,
          fileId: new mongoose.Types.ObjectId(msg.gridFsId),
          size: msg.size,
          mimeType: 'application/zip',
          isGenerated: true,
        });

        await JobModel.findByIdAndUpdate(job._id, {
          status: 'COMPLETED',
          outputFileId: newFile._id,
          completedAt: new Date(),
          progress: 100,
        });
      }

      if (msg.type === 'ERROR') {
        await JobModel.findByIdAndUpdate(job._id, {
          status: 'FAILED',
          error: msg.message,
        });
      }
    });

    // Handle crash
    worker.on('error', async (err) => {
      console.error('Worker error:', err);

      await JobModel.findByIdAndUpdate(job._id, {
        status: 'FAILED',
        error: err.message,
      });
    });
  }
  static async streamZipToResponse(jobId: string, res: Response) {
    //  Validate jobId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw { status: 400, message: 'Invalid jobId' };
    }

    // Fetch job
    const job = await JobModel.findById(jobId);
    if (!job) {
      throw { status: 404, message: 'Job not found' };
    }

    // Ensure completed
    if (job.status !== 'COMPLETED' || !job.outputFileId) {
      throw { status: 400, message: 'ZIP not ready yet' };
    }

    // Fetch file
    const fileDoc = await FileModel.findById(job.outputFileId);
    if (!fileDoc) {
      throw { status: 404, message: 'File not found' };
    }

    // DB check
    const db = mongoose.connection.db;
    if (!db) {
      throw { status: 500, message: 'DB not connected' };
    }

    const bucket = new mongoose.mongo.GridFSBucket(db);
    const fileId = new mongoose.Types.ObjectId(fileDoc.fileId);

    // Headers
    res.setHeader('Content-Type', fileDoc.mimeType || 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileDoc.name}"`,
    );

    // Stream
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('error', (err) => {
      console.error('Download stream error:', err);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found in storage' });
      }
    });

    downloadStream.pipe(res);
  }
}
