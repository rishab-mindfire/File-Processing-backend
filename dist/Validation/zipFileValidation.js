"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileZipSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.fileZipSchema = joi_1.default.object({
    fileIds: joi_1.default.array()
        .items(joi_1.default.string().custom((value, helpers) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }, 'ObjectId validation'))
        .min(1)
        .required()
        .messages({
        'any.invalid': 'File does not belong to this project',
        'array.min': 'fileIds cannot be empty',
    }),
});
//# sourceMappingURL=zipFileValidation.js.map