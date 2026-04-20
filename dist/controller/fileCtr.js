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
exports.fileCtr = void 0;
const fileService_1 = require("../services/fileService");
const projectModel_1 = __importDefault(require("../models/projectModel"));
const mongoose_1 = __importDefault(require("mongoose"));
class fileCtr {
}
exports.fileCtr = fileCtr;
_a = fileCtr;
// upload files based on project id
fileCtr.uploadFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId: projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        const project = yield projectModel_1.default.findById(projectId);
        if (!project) {
            return res.json({ status: 400, message: 'Project not found' });
        }
        const files = req.files;
        const upload = yield fileService_1.FileService.uploadFiles(projectId, files);
        const safeFiles = upload.map((file) => ({
            name: file.name,
            size: file.size,
            _id: file._id,
        }));
        res.status(200).json({
            message: 'Files stored successfully',
            data: safeFiles,
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Internal Server Error',
        });
    }
});
// list files based on project ID
fileCtr.getFileDetailsList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId: projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        const project = yield projectModel_1.default.findById(projectId);
        if (!project) {
            return res.json({ status: 400, message: 'Project not found' });
        }
        const files = yield fileService_1.FileService.listFiles(projectId);
        res.status(200).json(files);
    }
    catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Internal Server Error',
        });
    }
});
// delete file
fileCtr.deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId, projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        const result = yield fileService_1.FileService.deleteFile(fileId);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Internal Server Error',
        });
    }
});
// download files
fileCtr.downloadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileId, projectId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        yield fileService_1.FileService.downloadFile({ fileId, projectId }, res);
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Internal Server Error',
        });
    }
});
//# sourceMappingURL=fileCtr.js.map