"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoute = void 0;
const express_1 = require("express");
const project_controller_1 = require("../controller/project.controller");
const Job_controller_1 = require("../controller/Job.controller");
const multer_1 = __importDefault(require("multer"));
const file_controller_1 = require("../controller/file.controller");
// Configure Multer for file storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
exports.projectRoute = (0, express_1.Router)();
// Project Management
exports.projectRoute.post('/', project_controller_1.ProjectCtr.createProject);
exports.projectRoute.get('/', project_controller_1.ProjectCtr.listProjects);
exports.projectRoute.get('/:projectId', project_controller_1.ProjectCtr.viewProject);
exports.projectRoute.put('/:projectId', project_controller_1.ProjectCtr.updateProject);
exports.projectRoute.delete('/:projectId', project_controller_1.ProjectCtr.deleteProject);
// File Operations
exports.projectRoute.post('/:projectId/files', upload.any(), file_controller_1.fileCtr.uploadFiles);
exports.projectRoute.get('/:projectId/files', file_controller_1.fileCtr.getFileDetailsList);
exports.projectRoute.get('/:projectId/files/:fileId/download', file_controller_1.fileCtr.downloadFile);
exports.projectRoute.delete('/:projectId/files/:fileId', file_controller_1.fileCtr.deleteFile);
// Jobs creation ZIP of files
exports.projectRoute.post('/:projectId/jobs/zip', Job_controller_1.JobCtr.createZipJob);
exports.projectRoute.get('/:projectId/zip', Job_controller_1.JobCtr.getZipsDetailsList);
exports.projectRoute.get('/:projectId/jobs/:jobId', Job_controller_1.JobCtr.getJobStatus);
exports.projectRoute.get('/:projectId/jobs/:jobId/download', Job_controller_1.JobCtr.downloadZip);
exports.projectRoute.delete('/:projectId/jobs/:jobId', Job_controller_1.JobCtr.deleteZipJob);
//# sourceMappingURL=projectRouter.js.map