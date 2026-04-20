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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = require("./router/user");
const authRoleBased_1 = __importDefault(require("./middlewares/authRoleBased"));
const connectDB_config_1 = __importDefault(require("./config/connectDB.config"));
const cors_1 = __importDefault(require("cors"));
const projectRouter_1 = require("./router/projectRouter");
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.dev';
dotenv_1.default.config({ path: envFile });
dotenv_1.default.config();
const app = (0, express_1.default)();
// cors policy attach
const frontend_url = process.env.FRONTEND_URL || 'http://localhost:3001';
const corsOptions = {
    origin: [frontend_url, 'http://localhost:3002'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
// Middleware to parse JSON and URL-encoded bodies
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// routes
app.use('/user', user_1.userRouter);
app.use('/projects', (0, authRoleBased_1.default)('admin'), projectRouter_1.projectRoute);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, connectDB_config_1.default)();
        app.listen(port, () => {
            console.log(`App is running on ${port}`);
        });
    }
    catch (err) {
        console.error('Failed to connect to DB', err);
    }
});
startServer();
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV;
app.listen(port, () => {
    console.log(`${env} : App is running on ${port}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map