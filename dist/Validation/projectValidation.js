"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.projectSchema = joi_1.default.object({
    projectName: joi_1.default.string().trim().min(3).max(100).required().messages({
        'string.empty': 'Project name is required',
        'string.min': 'Project name must be at least 3 characters',
        'string.max': 'Project name must be less than 100 characters',
    }),
    projectDescription: joi_1.default.string().allow('').max(500).optional().messages({
        'string.max': 'Description must be less than 500 characters',
    }),
});
//# sourceMappingURL=projectValidation.js.map