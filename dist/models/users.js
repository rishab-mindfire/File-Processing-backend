"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    userID: {
        type: String,
        require: true,
        unique: true,
    },
    userName: {
        type: String,
        require: true,
    },
    userEmail: {
        type: String,
        required: true,
        unique: true,
    },
    userPassword: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
}, { timestamps: true });
exports.UsersModel = (0, mongoose_1.model)('Users', userSchema);
//# sourceMappingURL=users.js.map