"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyTokenAndGetUser = verifyTokenAndGetUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateToken(user) {
    const secret = process.env.JWT_SECRETE;
    if (secret)
        return jsonwebtoken_1.default.sign(user, secret, { expiresIn: 60 * 60 * 12 });
}
function verifyTokenAndGetUser(token) {
    const secret = process.env.JWT_SECRETE;
    if (!token)
        return null;
    try {
        if (secret)
            return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=authGeneral.service.js.map