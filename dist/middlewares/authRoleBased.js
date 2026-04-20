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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authRole_service_1 = require("../services/authRole.service");
const authGeneral_service_1 = require("../services/authGeneral.service");
function authRoleBased(...allowedRoles) {
    const secret = process.env.JWT_SECRETE;
    // check token in each incomming request
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        var userToken = (_a = req === null || req === void 0 ? void 0 : req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.toString();
        const token = userToken && userToken.split(' ')[1];
        if (!token) {
            res.status(404).send('token not found !');
            return;
        }
        const user = (0, authGeneral_service_1.verifyTokenAndGetUser)(token);
        if (!user) {
            res.status(405).send('Invalid token, please login!');
            return;
        }
        try {
            if (secret && token !== undefined) {
                const userDetails = jsonwebtoken_1.default.verify(token, secret);
                const userEmail = yield JSON.parse(JSON.stringify(userDetails))
                    .userEmail;
                const userRole = yield (0, authRole_service_1.verifyEmplyeeRole)(userEmail);
                if (!allowedRoles.includes(userRole))
                    return res.status(404).send('User not authorized !');
                else {
                    req.userEmail = userEmail;
                    next();
                }
            }
        }
        catch (error) {
            next(error);
            return res.status(404).send(`somthing went wrong !, ${error}`);
        }
    });
}
exports.default = authRoleBased;
//# sourceMappingURL=authRoleBased.js.map