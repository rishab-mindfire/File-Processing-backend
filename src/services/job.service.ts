import { Worker } from 'worker_threads';
import mongoose, { Types } from 'mongoose';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { fileURLToPath } from 'url';
import FileModel from '../models/file.model.js';
import JobModel from '../models/job.model.js';
import ProjectModel from '../models/project.model.js';
import {
  CompletedJobRaw,
  FileDocType,
  FilePopulated,
  SelectedFile,
  WorkerMessage,
} from '../types/index.js';

/* ================= PATH SETUP ================= */

const ZIPS_DIR = path.resolve(process.env.UPLOAD_PATH_ZIPS || './uploads/zips');

const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirectoryExists(ZIPS_DIR);

/* ================= SERVICE ================= */

export class JobService {
  /* ========= CREATE ZIP ========= */
  static async createZip({
    job,
    projectId,
    selectedFiles,
  }: {
    job: { _id: Types.ObjectId };
    projectId: string;
    selectedFiles: SelectedFile[];
  }) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // ESM-safe __dirname
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // IMPORTANT: ensure correct runtime path (dist vs src)
    const workerPath = path.resolve(__dirname, '../workers/zip-worker.cjs');

    ensureDirectoryExists(ZIPS_DIR);

    const worker = new Worker(workerPath, {
      workerData: {
        jobId: job._id.toString(),
        projectId,
        outputDir: ZIPS_DIR,
        files: selectedFiles.map((f) => ({
          name: f.name,
          path: f.storagePath,
        })),
      },
    });

    /* ===== WORKER MESSAGE ===== */
    worker.on('message', async (msg: WorkerMessage) => {
      if (msg.type === 'DONE') {
        try {
          const newFile = await FileModel.create({
            projectId,
            name: msg.name,
            storagePath: msg.outputPath,
            size: msg.size,
            mimeType: 'application/zip',
            isGenerated: true,
          });

          await JobModel.findByIdAndUpdate(job._id, {
            status: 'COMPLETED',
            outputFileId: newFile._id,
            completedAt: new Date(),
            progress: 100,
            size: msg.size,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to save ZIP metadata';

          await JobModel.findByIdAndUpdate(job._id, {
            status: 'FAILED',
            error: message,
          });
        }
      }

      if (msg.type === 'ERROR') {
        await JobModel.findByIdAndUpdate(job._id, {
          status: 'FAILED',
          error: msg.message,
        });
      }
    });

    /* ===== WORKER ERROR ===== */
    worker.on('error', async (err: Error) => {
      const message = err.message || 'Worker crashed';

      await JobModel.findByIdAndUpdate(job._id, {
        status: 'FAILED',
        error: message,
      });
    });
  }

  /* ========= DOWNLOAD ZIP ========= */
  static async downloadZip(jobId: string, res: Response) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new Error('Invalid jobId');
    }

    const job = await JobModel.findById(jobId).populate('outputFileId');

    if (!job) {
      throw new Error('Compression job not found');
    }

    if (job.status !== 'COMPLETED' || !job.outputFileId) {
      throw new Error('ZIP file is not ready or failed to generate');
    }
    const fileDoc = job.outputFileId as unknown as FileDocType;

    if (!fs.existsSync(fileDoc.storagePath)) {
      throw new Error('Physical ZIP file not found on server');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);

    const fileStream = fs.createReadStream(fileDoc.storagePath);

    fileStream.on('error', (err: Error) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Failed to read ZIP from storage' });
      }
    });

    fileStream.pipe(res);
  }

  /* ========= LIST ZIPS ========= */
  static async listZips(projectId: string) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error('Invalid Project ID');
    }

    const completedJobs = await JobModel.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      type: 'ZIP_COMPRESSION',
      status: 'COMPLETED',
    })
      .populate({
        path: 'outputFileId',
        select: 'name size',
      })
      .sort({ completedAt: -1 })
      .lean();
    return completedJobs
      .filter(
        (job) =>
          job.outputFileId && typeof job.outputFileId === 'object' && 'name' in job.outputFileId,
      )
      .map((job: CompletedJobRaw) => {
        const file = job.outputFileId as FilePopulated;

        return {
          jobId: job._id,
          fileName: file.name,
          size: file.size,
          completedAt: job.completedAt,
        };
      });
  }

  /* ========= DELETE ZIP ========= */
  static async deleteZipJob(jobId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new Error('Invalid jobId');
    }

    const job = await JobModel.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.outputFileId) {
      const fileDoc = await FileModel.findById(job.outputFileId);

      if (fileDoc?.storagePath && fs.existsSync(fileDoc.storagePath)) {
        fs.unlinkSync(fileDoc.storagePath);
      }

      await FileModel.findByIdAndDelete(job.outputFileId);
    }

    await JobModel.findByIdAndDelete(jobId);

    return { success: true, message: 'ZIP job deleted successfully' };
  }
}
