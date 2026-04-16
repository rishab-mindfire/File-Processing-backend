import { Worker } from 'worker_threads';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import FileModel from '../models/fileModel';
import JobModel from '../models/jobModel';
import ProjectModel from '../models/projectModel';

const ZIPS_DIR = path.resolve(process.env.UPLOAD_PATH_ZIPS || './uploads/zips');
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[Storage] ZIP directory created at: ${dirPath}`);
  }
};

// create folder for ZIPed files
ensureDirectoryExists(ZIPS_DIR);

export class JobService {
  // create Zip of files based on array of files id
  static async createZip({
    job,
    projectId,
    selectedFiles,
  }: {
    job: any;
    projectId: string;
    selectedFiles: any[];
  }) {
    // check existence of project
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw { status: 400, message: 'Project not found' };
    }

    // Resolve path
    const workerPath = path.resolve(__dirname, '../workers/zip-Worker.js');

    //check for folder exist or not else it will  create
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

    // Handle messages from Worker
    worker.on('message', async (msg) => {
      if (msg.type === 'DONE') {
        try {
          // Create a metadata for ZIP file
          const newFile = await FileModel.create({
            projectId,
            name: msg.name,
            storagePath: msg.outputPath,
            size: msg.size,
            mimeType: 'application/zip',
            isGenerated: true,
          });

          // Mark the background job as completed once done
          await JobModel.findByIdAndUpdate(job._id, {
            status: 'COMPLETED',
            outputFileId: newFile._id,
            completedAt: new Date(),
            progress: 100,
          });
        } catch (err: any) {
          console.error('Error saving ZIP metadata:', err);
        }
      }

      if (msg.type === 'ERROR') {
        await JobModel.findByIdAndUpdate(job._id, {
          status: 'FAILED',
          error: msg.message,
        });
      }
    });

    worker.on('error', async (err) => {
      console.error('Worker thread crash:', err);
      await JobModel.findByIdAndUpdate(job._id, {
        status: 'FAILED',
        error: err.message,
      });
    });
  }

  // download zip file
  static async downloadZip(jobId: string, res: Response) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw { status: 400, message: 'Invalid jobId' };
    }

    // Populate the outputFileId to get the storagePath from FileModel
    const job = await JobModel.findById(jobId).populate('outputFileId');

    if (!job) {
      throw { status: 404, message: 'Compression job not found' };
    }

    if (job.status !== 'COMPLETED' || !job.outputFileId) {
      throw {
        status: 400,
        message: 'ZIP file is not ready or failed to generate',
      };
    }

    const fileDoc = job.outputFileId as any;

    if (!fs.existsSync(fileDoc.storagePath)) {
      throw { status: 404, message: 'Physical ZIP file not found on server' };
    }

    // Set download headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileDoc.name}"`,
    );

    // Stream directly from disk to client
    const fileStream = fs.createReadStream(fileDoc.storagePath);

    fileStream.on('error', (err) => {
      console.error('File ReadStream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read ZIP from storage' });
      }
    });

    fileStream.pipe(res);
  }

  // list of ziped files
  static async listZips(projectId: string) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw { status: 400, message: 'Invalid Project ID' };
    }

    // check for completed job
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

    //filter based on outputFileId
    return completedJobs
      .filter((job) => job.outputFileId)
      .map((job: any) => ({
        jobId: job._id,
        fileName: job.outputFileId.name,
        size: job.outputFileId.size,
        completedAt: job.completedAt,
      }));
  }
}
