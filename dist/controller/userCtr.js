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
exports.UserCtr = void 0;
const users_1 = require("../services/users");
const authGeneral_1 = require("../services/authGeneral");
const userRegistration_1 = require("../Validation/userRegistration");
const users_2 = require("../models/users");
const authRole_1 = require("../services/authRole");
class userClass {
    constructor() {
        //create user detault admin
        this.userRegistration = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = req.body;
            if (!data) {
                return res.status(400).json({
                    message: 'provide body',
                });
            }
            // validating the registarion request
            const { error, value } = userRegistration_1.UserRegistrationValidation.validate(data);
            if (error)
                return res.send(error.message);
            //check for unique email
            const email = yield users_1.userServices.checkEmail(req.body.userEmail);
            if (!email) {
                yield users_1.userServices.createUser(value);
                res.status(201).send('user created successfully !');
            }
            else {
                res.status(409).send('Email allready exists !');
            }
        });
        //login
        this.userLogin = (req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.body || Object.keys(req.body).length === 0) {
                return res
                    .status(400)
                    .json({ message: 'Request body is missing or empty' });
            }
            const { error, value } = userRegistration_1.UserLoginValidation.validate(req.body);
            //validating the login request
            if (error) {
                return res.status(400).json({
                    message: 'Validation failed',
                    details: error.details[0].message.replace(/"/g, ''),
                });
            }
            const { userEmail, userPassword } = value;
            try {
                const checkPassword = yield users_1.userServices.checkSigninPassword(userEmail, userPassword);
                if (!checkPassword) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                //generate JWT and attach to response header
                const JWTtoken = (0, authGeneral_1.generateToken)({ userEmail });
                const userRole = yield (0, authRole_1.verifyEmplyeeRole)(userEmail);
                res.setHeader('Authorization', 'Bearer ' + JWTtoken);
                return res.status(200).json({
                    message: 'Login successful',
                    role: userRole,
                });
            }
            catch (err) {
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        });
        //cahange pass
        this.userChangePassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = req.body;
            const user = yield users_2.UsersModel.findOne({ userEmail: req.body.userEmail });
            if (user) {
                res.status(200).send(user);
            }
            else {
                res.status(404).send('Email not found !');
            }
        });
    }
}
exports.UserCtr = new userClass();
//# sourceMappingURL=userCtr.js.map