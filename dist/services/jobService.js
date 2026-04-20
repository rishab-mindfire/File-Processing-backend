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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const worker_threads_1 = require("worker_threads");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fileModel_1 = __importDefault(require("../models/fileModel"));
const jobModel_1 = __importDefault(require("../models/jobModel"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
const ZIPS_DIR = path_1.default.resolve(process.env.UPLOAD_PATH_ZIPS || './uploads/zips');
const ensureDirectoryExists = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`[Storage] ZIP directory created at: ${dirPath}`);
    }
};
// create folder for ZIPed files
ensureDirectoryExists(ZIPS_DIR);
class JobService {
    // create Zip of files based on array of files id
    static createZip(_a) {
        return __awaiter(this, arguments, void 0, function* ({ job, projectId, selectedFiles, }) {
            // check existence of project
            const project = yield projectModel_1.default.findById(projectId);
            if (!project) {
                throw { status: 400, message: 'Project not found' };
            }
            // Resolve path
            const workerPath = path_1.default.resolve(__dirname, '../workers/zip-Worker.js');
            //check for folder exist or not else it will  create
            ensureDirectoryExists(ZIPS_DIR);
            const worker = new worker_threads_1.Worker(workerPath, {
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
            worker.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
                if (msg.type === 'DONE') {
                    try {
                        // Create a metadata for ZIP file
                        const newFile = yield fileModel_1.default.create({
                            projectId,
                            name: msg.name,
                            storagePath: msg.outputPath,
                            size: msg.size,
                            mimeType: 'application/zip',
                            isGenerated: true,
                        });
                        // Mark the background job as completed once done
                        yield jobModel_1.default.findByIdAndUpdate(job._id, {
                            status: 'COMPLETED',
                            outputFileId: newFile._id,
                            completedAt: new Date(),
                            progress: 100,
                            size: msg.size,
                        });
                    }
                    catch (err) {
                        console.error('Error saving ZIP metadata:', err);
                    }
                }
                if (msg.type === 'ERROR') {
                    yield jobModel_1.default.findByIdAndUpdate(job._id, {
                        status: 'FAILED',
                        error: msg.message,
                    });
                }
            }));
            worker.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
                console.error('Worker thread crash:', err);
                yield jobModel_1.default.findByIdAndUpdate(job._id, {
                    status: 'FAILED',
                    error: err.message,
                });
            }));
        });
    }
    // download zip file
    static downloadZip(jobId, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(jobId)) {
                throw { status: 400, message: 'Invalid jobId' };
            }
            // Populate the outputFileId to get the storagePath from FileModel
            const job = yield jobModel_1.default.findById(jobId).populate('outputFileId');
            if (!job) {
                throw { status: 404, message: 'Compression job not found' };
            }
            if (job.status !== 'COMPLETED' || !job.outputFileId) {
                throw {
                    status: 400,
                    message: 'ZIP file is not ready or failed to generate',
                };
            }
            const fileDoc = job.outputFileId;
            if (!fs_1.default.existsSync(fileDoc.storagePath)) {
                throw { status: 404, message: 'Physical ZIP file not found on server' };
            }
            // Set download headers
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);
            // Stream directly from disk to client
            const fileStream = fs_1.default.createReadStream(fileDoc.storagePath);
            fileStream.on('error', (err) => {
                console.error('File ReadStream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to read ZIP from storage' });
                }
            });
            fileStream.pipe(res);
        });
    }
    // list of ziped files
    static listZips(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
                throw { status: 400, message: 'Invalid Project ID' };
            }
            const completedJobs = yield jobModel_1.default.find({
                projectId: new mongoose_1.default.Types.ObjectId(projectId),
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
                .filter((job) => job.outputFileId)
                .map((job) => ({
                jobId: job._id,
                fileName: job.outputFileId.name,
                size: job.outputFileId.size,
                completedAt: job.completedAt,
                //downloadUrl: `/projects/${projectId}/jobs/${job._id}/download`,
            }));
        });
    }
    // Delete Zip file
    static deleteZipJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(jobId)) {
                throw { status: 400, message: 'Invalid jobId' };
            }
            const job = yield jobModel_1.default.findById(jobId);
            if (!job) {
                throw { status: 404, message: 'Job not found' };
            }
            // Delete physical file if exists
            if (job.outputFileId) {
                const fileDoc = yield fileModel_1.default.findById(job.outputFileId);
                if ((fileDoc === null || fileDoc === void 0 ? void 0 : fileDoc.storagePath) && fs_1.default.existsSync(fileDoc.storagePath)) {
                    fs_1.default.unlinkSync(fileDoc.storagePath);
                }
                yield fileModel_1.default.findByIdAndDelete(job.outputFileId);
            }
            //  Delete job itself
            yield jobModel_1.default.findByIdAndDelete(jobId);
            return { success: true, message: 'ZIP job deleted successfully' };
        });
    }
}
exports.JobService = JobService;
//# sourceMappingURL=jobService.js.map