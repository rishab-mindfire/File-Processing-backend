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
exports.userServices = void 0;
const users_1 = require("../models/users");
const bcrypt_1 = __importDefault(require("bcrypt"));
const randomId_1 = require("../utils/randomId");
class Users {
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newPass = yield bcrypt_1.default.hash(data.userPassword.toString(), 10);
                const userData = Object.assign(Object.assign({}, data), { userPassword: newPass });
                userData.userID = (0, randomId_1.generateCustomId)();
                yield users_1.UsersModel.create(userData);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    checkEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield users_1.UsersModel.findOne({ userEmail: email });
                return user;
            }
            catch (error) {
                console.log(error);
                return null;
            }
        });
    }
    checkSigninPassword(userEmail, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield users_1.UsersModel.findOne({
                userEmail: userEmail,
            });
            if (user !== null) {
                //check hased password
                const match = yield bcrypt_1.default.compare(password, user.userPassword.toString());
                if (match)
                    return true;
                else
                    return false;
            }
        });
    }
}
exports.userServices = new Users();
//# sourceMappingURL=users.js.map