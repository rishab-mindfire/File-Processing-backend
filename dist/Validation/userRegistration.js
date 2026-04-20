"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userChangePassword = exports.userLoginValidation = exports.userRegistrationValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.userRegistrationValidation = joi_1.default.object({
    userName: joi_1.default.string().required(),
    userEmail: joi_1.default.string().email().required(),
    userPassword: joi_1.default.string().min(4).alphanum().required(),
    role: joi_1.default.string().valid('admin', 'public').required(),
});
exports.userLoginValidation = joi_1.default.object({
    userEmail: joi_1.default.string().email().required().messages({
        'string.email': 'userEmail must be a valid email',
    }),
    userPassword: joi_1.default.string().min(5).required(),
});
exports.userChangePassword = joi_1.default.object({
    userEmail: joi_1.default.string().required(),
    userPassword: joi_1.default.string().required(),
    confirmPassord: joi_1.default.any().valid(joi_1.default.ref('userPassword')).required(),
});
//# sourceMappingURL=userRegistration.js.map