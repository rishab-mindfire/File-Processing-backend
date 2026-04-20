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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmplyeeRole = verifyEmplyeeRole;
const users_1 = require("../models/users");
// verify role based on username
function verifyEmplyeeRole(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield users_1.UsersModel.findOne({ userEmail: email }, { role: 1, _id: 0 });
            if (user)
                return user.role;
        }
        catch (error) {
            console.log(`Not found any data based on email ${error}`);
        }
    });
}
//# sourceMappingURL=authRole.js.map