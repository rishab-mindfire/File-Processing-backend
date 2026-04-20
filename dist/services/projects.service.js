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
exports.ProjectServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const file_model_1 = __importDefault(require("../models/file.model"));
const job_model_1 = __importDefault(require("../models/job.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
class ProjectServices {
    //Create Project
    static createNewProject(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new project_model_1.default(data);
            return yield project.save();
        });
    }
    // Lists all projects with file/zip counts
    static listAllProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield project_model_1.default.aggregate([
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'files',
                        localField: '_id',
                        foreignField: 'projectId',
                        as: 'files',
                    },
                },
                {
                    $lookup: {
                        from: 'zipjobs',
                        localField: '_id',
                        foreignField: 'projectId',
                        as: 'jobs',
                    },
                },
                {
                    $addFields: {
                        totalFiles: { $size: '$files' },
                        totalZips: {
                            $size: {
                                $filter: {
                                    input: '$jobs',
                                    as: 'job',
                                    cond: { $eq: ['$$job.status', 'COMPLETED'] },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        files: 0,
                        jobs: 0,
                        owner: 0,
                    },
                },
            ]);
        });
    }
    // Get Project Details with basic stats
    static getProjectWithStats(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = new mongoose_1.default.Types.ObjectId(projectId);
            const stats = yield project_model_1.default.aggregate([
                { $match: { _id: id } },
                {
                    $lookup: {
                        from: 'files',
                        localField: '_id',
                        foreignField: 'projectId',
                        as: 'files',
                    },
                },
                {
                    $lookup: {
                        from: 'zipjobs',
                        localField: '_id',
                        foreignField: 'projectId',
                        as: 'jobs',
                    },
                },
                {
                    $project: {
                        projectName: 1,
                        projectDescription: 1,
                        createdAt: 1,
                        filesCount: { $size: '$files' },
                        jobsCount: { $size: '$jobs' },
                    },
                },
            ]);
            return stats[0];
        });
    }
    // delete project with clean-up
    static deleteProject(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
                throw { status: 400, message: 'Invalid projectId' };
            }
            const project = yield project_model_1.default.findById(projectId);
            if (!project) {
                throw { status: 404, message: 'Project not found' };
            }
            // delete all file records
            const files = yield file_model_1.default.find({ projectId });
            // Delete actual physical files from Disk
            yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (file.storagePath && fs_1.default.existsSync(file.storagePath)) {
                        yield fs_1.default.promises.unlink(file.storagePath);
                    }
                }
                catch (err) {
                    console.error(`Failed to delete disk file: ${file.storagePath}`, err);
                }
            })));
            // Delete metadata from Database (Cascade)
            yield Promise.all([
                file_model_1.default.deleteMany({ projectId }),
                job_model_1.default.deleteMany({ projectId }),
                project_model_1.default.findByIdAndDelete(projectId),
            ]);
            return {
                message: 'Project and all associated files and jobs deleted successfully',
            };
        });
    }
}
exports.ProjectServices = ProjectServices;
_a = ProjectServices;
//update project
ProjectServices.updateProject = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield project_model_1.default.findByIdAndUpdate(id, { $set: data }, { new: true });
});
//# sourceMappingURL=projects.service.js.map