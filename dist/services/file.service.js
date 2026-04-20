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
exports.FileService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const file_model_1 = __importDefault(require("../models/file.model"));
const fileValidation_1 = require("../Validation/fileValidation");
const FILES_DIR = path_1.default.resolve(process.env.UPLOAD_PATH_FILES || './uploads/files');
const ensureDirectoryExists = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`[Storage] Created directory: ${dirPath}`);
    }
};
// create folder upload/files
ensureDirectoryExists(FILES_DIR);
class FileService {
    // upload files
    static uploadFiles(projectId, files) {
        return __awaiter(this, void 0, void 0, function* () {
            // check file
            if (!files || files.length === 0) {
                throw { status: 400, message: 'No files uploaded' };
            }
            // check directory created or not
            ensureDirectoryExists(FILES_DIR);
            // Validate files before upload
            for (const file of files) {
                const { error } = fileValidation_1.fileSchema.validate({
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                });
                if (error) {
                    throw {
                        status: 400,
                        message: `Invalid file ${file.originalname}: ${error.message}`,
                    };
                }
            }
            const uploadPromises = files.map((file) => __awaiter(this, void 0, void 0, function* () {
                // Create unique filename
                const uniqueName = `${Date.now()}-${file.originalname}`;
                const storagePath = path_1.default.join(FILES_DIR, uniqueName);
                // Write to disk
                yield fs_1.default.promises.writeFile(storagePath, file.buffer);
                return yield file_model_1.default.create({
                    projectId,
                    name: file.originalname,
                    storagePath: storagePath,
                    size: file.size,
                    mimeType: file.mimetype,
                    isGenerated: false,
                });
            }));
            return yield Promise.all(uploadPromises);
        });
    }
    // list fileDetails
    static listFiles(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield file_model_1.default.find({ projectId })
                .select('name size')
                .sort({ createdAt: -1 })
                .lean();
        });
    }
    // delete file by fileId
    static deleteFile(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find file in DB
            const fileDoc = yield file_model_1.default.findById(fileId);
            if (!fileDoc) {
                throw { status: 404, message: 'File not found' };
            }
            //  Delete physical file (if exists)
            try {
                const fullPath = path_1.default.resolve(fileDoc.storagePath);
                if (fs_1.default.existsSync(fullPath)) {
                    yield fs_1.default.promises.unlink(fullPath);
                    console.log('Deleted file from disk:', fullPath);
                }
                else {
                    console.warn('File not found on disk:', fullPath);
                }
            }
            catch (err) {
                console.error('Error deleting file from disk:', err);
            }
            // Delete DB record
            yield file_model_1.default.findByIdAndDelete(fileId);
            return { message: 'File deleted successfully' };
        });
    }
    // download file based on file id
    static downloadFile(requestParam, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileId, projectId } = requestParam;
            // Fetch ONLY if file belongs to project
            const fileDoc = yield file_model_1.default.findOne({
                _id: fileId,
                projectId: projectId,
            });
            if (!fileDoc) {
                throw { status: 404, message: 'File not found for this project' };
            }
            // Check physical file
            if (!fs_1.default.existsSync(fileDoc.storagePath)) {
                throw { status: 404, message: 'Physical file missing from storage' };
            }
            // Headers
            res.setHeader('Content-Type', fileDoc.mimeType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);
            // Stream
            const readStream = fs_1.default.createReadStream(fileDoc.storagePath);
            readStream.on('error', (err) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Stream failure' });
                }
            });
            readStream.pipe(res);
        });
    }
}
exports.FileService = FileService;
//# sourceMappingURL=file.service.js.map