"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobCtr = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const job_model_1 = __importDefault(require("../models/job.model"));
const file_model_1 = __importDefault(require("../models/file.model"));
const job_service_1 = require("../services/job.service");
const zipFileValidation_1 = require("../Validation/zipFileValidation");
class JobCtr {
}
exports.JobCtr = JobCtr;
_a = JobCtr;
// create zip creation job
JobCtr.createZipJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { projectId: projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        //Validate input files
        const result = zipFileValidation_1.fileZipSchema.validate(req.body);
        if (result.error || !result.value) {
            return res.status(400).json({
                error: ((_b = result.error) === null || _b === void 0 ? void 0 : _b.message) || 'Add files',
            });
        }
        const { fileIds } = result.value;
        // Fetch valid files FIRST
        const selectedFiles = yield file_model_1.default.find({
            _id: { $in: fileIds },
            projectId,
        });
        if (selectedFiles.length === 0) {
            return res.status(404).json({
                error: 'No valid files found for this project',
            });
        }
        // Create job ONLY if valid files exist
        const job = yield job_model_1.default.create({
            projectId,
            status: 'PROCESSING',
            startedAt: new Date(),
        });
        // Start background worker
        job_service_1.JobService.createZip({
            job,
            projectId,
            selectedFiles,
        });
        res.status(202).json({
            message: 'Zip job started',
            jobId: job._id,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// get all ziped project based on project id
JobCtr.getZipsDetailsList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId: projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        const zips = yield job_service_1.JobService.listZips(projectId);
        res.status(200).json(zips);
    }
    catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});
// check job status of zip file based on job-id form db
JobCtr.getJobStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { jobId, projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        // Validate ObjectId format
        if (!mongoose_1.default.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ error: 'Invalid Job ID format' });
        }
        // Fetch Job by job-id
        const job = yield job_model_1.default.findById(jobId).select('status progress size');
        // Handle Not Found
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Return Job state
        res.status(200).json(job);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// download zip with job-ID
JobCtr.downloadZip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { jobId, projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        yield job_service_1.JobService.downloadZip(jobId, res);
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Internal Server Error',
        });
    }
});
// Delete Zip
JobCtr.deleteZipJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { jobId } = req.params;
        const result = yield job_service_1.JobService.deleteZipJob(jobId);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(err.status || 500).json({
            error: err.message || 'Internal server error',
        });
    }
});
//# sourceMappingURL=Job.controller.js.map