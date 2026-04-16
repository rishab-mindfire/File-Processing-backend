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
projectRoute.get('/:projectId', ProjectCtr.viewProject);
projectRoute.delete('/:projectId', ProjectCtr.deleteProject);

// File Operations
projectRoute.post('/:projectId/files', upload.any(), fileCtr.uploadFiles);
projectRoute.get('/:projectId/files', fileCtr.listFiles);
projectRoute.get('/:projectId/files/:fileId/download', fileCtr.downloadFile);
projectRoute.delete('/:projectId/files/:fileId', fileCtr.deleteFile);

// Jobs creation ZIP of files
projectRoute.post('/:projectId/jobs/zip', JobCtr.createZipJob);
projectRoute.get('/:projectId/zip', JobCtr.getProjectZips);
projectRoute.get('/:projectId/jobs/:jobId', JobCtr.getJobStatus);
projectRoute.get('/:projectId/jobs/:jobId/download', JobCtr.downloadZip);
