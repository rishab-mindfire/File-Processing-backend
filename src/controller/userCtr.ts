import { Request, Response } from 'express';
import { userServices } from '../services/Users';
import { generateToken } from '../services/authGeneral';
import {
  UserChangePassword,
  UserLoginValidation,
  UserRegistrationValidation,
} from '../Validation/UserRegistration';
import { UsersModel } from '../models/Users';
import { verifyEmplyeeRole } from '../services/authRole';

class userClass {
  userRegistration = async (req: Request, res: Response) => {
    const data = req.body;
    //validating the registarion request
    const { error, value } = UserRegistrationValidation.validate(data);
    if (error) return res.send(error.message);
    //check for unique email
    const email = await userServices.checkEmail(req.body.userEmail);
    if (!email) {
      await userServices.createUser(value);
      res.status(201).send('user created successfully !');
    } else {
      res.status(409).send('Email allready exists !');
    }
  };
  userLogin = async (req: Request, res: Response) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: 'Request body is missing or empty' });
    }
    const { error, value } = UserLoginValidation.validate(req.body);
    //validating the login request
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        details: error.details[0].message,
      });
    }

    const { userEmail, password } = value;
    try {
      const checkPassword = await userServices.checkSigninPassword(
        userEmail,
        password,
      );

      if (!checkPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({ userEmail });
      const userRole = await verifyEmplyeeRole(userEmail);

      res.setHeader('Authorization', 'Bearer ' + token);
      return res.status(200).json({
        message: 'Login successful',
        role: userRole,
      });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  userChangePassword = async (req: Request, res: Response) => {
    const data = req.body;
    const { value, error } = UserChangePassword.validate(data);
    const user = await UsersModel.findOne({ userEmail: req.body.userEmail });
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send('Email not found !');
    }
  };
}
export const UserCtr = new userClass();
