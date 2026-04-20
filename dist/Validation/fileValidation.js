"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// file upload schema
exports.fileSchema = joi_1.default.object({
    originalname: joi_1.default.string().required(),
    mimetype: joi_1.default.string()
        .valid('text/plain', 'application/pdf', 'image/png', 'image/jpeg', 'application/zip', 
    // Video types
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 
    // .xls
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .required(),
    size: joi_1.default.number()
        .max(1000 * 1024 * 1024) // for testing purpose upload up-to 1000 mb
        .required(),
});
//# sourceMappingURL=fileValidation.js.map