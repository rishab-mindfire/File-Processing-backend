import { Router } from 'express';
import { ProjectCtr } from '../controller/projectCtr';
import { JobCtr } from '../controller/JobCtr';
import multer from 'multer';
import { fileCtr } from '../controller/fileCtr';

// Configure Multer for file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const projectRoute = Router();

// Project Management
projectRoute.post('/', ProjectCtr.createProject);
projectRoute.get('/', ProjectCtr.listProjects);
projectRoute.get('/:id', ProjectCtr.viewProject);
projectRoute.delete('/:id', ProjectCtr.deleteProject);

// File Operations
projectRoute.post('/:id/files', upload.any(), fileCtr.uploadFiles);
projectRoute.get('/:id/files', fileCtr.listFiles);
projectRoute.get('/:id/files/:fileId/download', fileCtr.downloadFile);
projectRoute.delete('/:id/files/:fileId', fileCtr.deleteFile);

// Background Jobs for ZIP
projectRoute.post('/:id/jobs/zip', JobCtr.createZipJob);
projectRoute.get('/:id/zip', JobCtr.getProjectZips);
projectRoute.get('/:id/jobs/:jobId', JobCtr.getJobStatus);
projectRoute.get('/:id/jobs/:jobId/download', JobCtr.downloadZip);
