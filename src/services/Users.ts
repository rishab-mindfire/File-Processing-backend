import { UsersModel } from '../models/Users';
import bcrypt from 'bcrypt';
import { UserType } from '../types';
import { generateCustomId } from '../utils/randomId';

class users {
  async createUser(data: UserType) {
    try {
      const newPass = await bcrypt.hash(data.password.toString(), 10);
      const userData = { ...data, password: newPass };
      userData.userID = generateCustomId();

      await UsersModel.create(userData);
    } catch (error) {
      console.log(error);
    }
  }
  async checkEmail(email: string) {
    try {
      const isEmail = await UsersModel.findOne({ userEmail: email });
      if (isEmail === null) {
        return false;
      } else if (isEmail) {
        return true;
      }
    } catch (error) {
      console.log(error);
    }
  }
  async checkSigninPassword(userEmail: string, password: string) {
    const user = await UsersModel.findOne({
      userEmail: userEmail,
    });
    if (user !== null) {
      //check hased password
      const match = await bcrypt.compare(password, user.password.toString());
      if (match) return true;
      else return false;
    }
  }
}

export const userServices = new users();
