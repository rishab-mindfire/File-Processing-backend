// Project Route Definition Module
// Maps HTTP endpoints to controller logic for project, file, and job management
// Integrates Multer middleware for handling multi-part file uploads in memory
// Structures the API surface into logical segments: Management, Operations, and Jobs
import { Router } from 'express';
import { ProjectCtr } from '../controller/project.controller.js';
import { JobCtr } from '../controller/Job.controller.js';
import multer from 'multer';
import { fileCtr } from '../controller/file.controller.js';

// Initialize Multer with memory storage to handle file buffers before processing
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const projectRoute = Router();

// CRUD operations for high-level project resource management
projectRoute.post('/', ProjectCtr.createProject);
projectRoute.get('/', ProjectCtr.listProjects);
projectRoute.get('/:projectId', ProjectCtr.viewProject);
projectRoute.put('/:projectId', ProjectCtr.updateProject);
projectRoute.delete('/:projectId', ProjectCtr.deleteProject);

// Operations for managing individual files and project assets
projectRoute.post('/:projectId/files', upload.any(), fileCtr.uploadFiles);
projectRoute.get('/:projectId/files', fileCtr.getFileDetailsList);
projectRoute.get('/:projectId/files/:fileId/download', fileCtr.downloadFile);
projectRoute.delete('/:projectId/files/:fileId', fileCtr.deleteFile);

// Endpoints for triggering and monitoring background ZIP compression tasks
projectRoute.post('/:projectId/jobs/zip', JobCtr.createZipJob);
projectRoute.get('/:projectId/zip', JobCtr.getZipsDetailsList);
projectRoute.get('/:projectId/jobs/:jobId', JobCtr.getJobStatus);
projectRoute.get('/:projectId/jobs/:jobId/download', JobCtr.downloadZip);
projectRoute.delete('/:projectId/jobs/:jobId', JobCtr.deleteZipJob);
