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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const options = {
    autoIndex: true,
    socketTimeoutMS: 45000,
};
//db connection using connection string
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const connectionString = process.env.DB_CONNECTION_STRING;
    console.log(`Connecting to ... ${connectionString}`);
    if (connectionString && process.env.NODE_ENV === 'dev') {
        yield mongoose_1.default
            .connect(connectionString, options)
            .then((res) => {
            if (res) {
                console.log(`Database connected successfully ! `);
            }
        })
            .catch((err) => {
            console.log(`Error in DB connection : ${connectionString}`, err);
        });
        return mongoose_1.default;
    }
    else {
        console.log(`Connection string is undefind ! ${connectionString}`);
    }
});
exports.default = connectDB;
//# sourceMappingURL=connectDB.config.js.map