// Job Service Module
// Manages the orchestration of asynchronous ZIP compression tasks using Worker Threads
// Handles the full lifecycle of compression jobs including creation, tracking, and deletion
// Bridges the gap between the primary API thread and intensive filesystem operations
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

// Define the root directory for generated ZIP archives from environment or defaults
const ZIPS_DIR = path.resolve(process.env.UPLOAD_PATH_ZIPS || './uploads/zips');

// Helper function to verify or create directory structures recursively
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize the ZIP storage directory during the service bootstrap phase
ensureDirectoryExists(ZIPS_DIR);

export class JobService {
  // Spawns a background Worker Thread to compress selected files into a single ZIP
  static async createZip({
    job,
    projectId,
    selectedFiles,
  }: {
    job: { _id: Types.ObjectId };
    projectId: string;
    selectedFiles: SelectedFile[];
  }) {
    // Verify project existence before initiating the resource-heavy worker
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Determine the absolute path to the worker script in an ESM environment
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workerPath = path.resolve(__dirname, '../workers/zip-worker.cjs');

    ensureDirectoryExists(ZIPS_DIR);

    // GENERATE THE PATH AND RECORD HERE ONCE
    const zipFileName = `project_${projectId}_${Date.now()}.zip`;
    const outputPath = path.join(ZIPS_DIR, zipFileName);

    // Create the record NOW so we have the ID, mark it as generated
    const zipFileRecord = await FileModel.create({
      projectId,
      name: zipFileName,
      storagePath: outputPath,
      size: 0, // Will update this when worker finishes
      mimeType: 'application/zip',
      isGenerated: true,
    });
    //send worker to do task
    const worker = new Worker(workerPath, {
      workerData: {
        jobId: job._id.toString(),
        projectId,
        outputPath, // Send the path already decided
        files: selectedFiles.map((f) => ({ name: f.name, path: f.storagePath })),
      },
    });

    worker.on('message', async (msg: WorkerMessage) => {
      if (msg.type === 'DONE') {
        try {
          // Just update the existing record with the final size
          await FileModel.findByIdAndUpdate(zipFileRecord._id, { size: msg.size });

          await JobModel.findByIdAndUpdate(job._id, {
            status: 'COMPLETED',
            outputFileId: zipFileRecord._id, // Link to the record we made above
            completedAt: new Date(),
            progress: 100,
            size: msg.size,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to save ZIP metadata';

          await JobModel.findByIdAndUpdate(job._id, {
            status: 'FAILED',
            error: message,
          });
        }
      }

      if (msg.type === 'ERROR') {
        // Cleanup: If zipping failed, delete the record we prepared
        await FileModel.findByIdAndDelete(zipFileRecord._id);
        await JobModel.findByIdAndUpdate(job._id, { status: 'FAILED', error: msg.message });
      }
    });
  }

  // Locates a completed ZIP job and streams the physical file to the client
  static async downloadZip(jobId: string, res: Response) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new Error('Invalid jobId');
    }

    // Populate the output file metadata to access the storage path
    const job = await JobModel.findById(jobId).populate('outputFileId');

    if (!job) {
      throw new Error('Compression job not found');
    }

    if (job.status !== 'COMPLETED' || !job.outputFileId) {
      throw new Error('ZIP file is not ready or failed to generate');
    }

    const fileDoc = job.outputFileId as unknown as FileDocType;

    // Verify disk availability before attempting to stream
    if (!fs.existsSync(fileDoc.storagePath)) {
      throw new Error('Physical ZIP file not found on server');
    }

    // Set binary headers for ZIP file transmission
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);

    // Stream the archive to the response to handle large files efficiently
    const fileStream = fs.createReadStream(fileDoc.storagePath);

    fileStream.on('error', (err: Error) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Failed to read ZIP from storage' });
      }
    });

    fileStream.pipe(res);
  }

  // Returns a list of all successful ZIP jobs for a project, mapped for UI display
  static async listZips(projectId: string) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error('Invalid Project ID');
    }

    // Retrieve and populate completed compression jobs sorted by date
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

    // Map database results into a standard format for the frontend
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

  // Purges a ZIP job record and unlinks the associated physical archive from disk
  static async deleteZipJob(jobId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new Error('Invalid jobId');
    }

    const job = await JobModel.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    // Remove the generated file asset and metadata if it exists
    if (job.outputFileId) {
      const fileDoc = await FileModel.findById(job.outputFileId);

      if (fileDoc?.storagePath && fs.existsSync(fileDoc.storagePath)) {
        fs.unlinkSync(fileDoc.storagePath);
      }

      await FileModel.findByIdAndDelete(job.outputFileId);
    }

    // Finalize deletion of the job tracking record
    await JobModel.findByIdAndDelete(jobId);

    return { success: true, message: 'ZIP job deleted successfully' };
  }
}
