import { UsersModel } from '../models/users.model.js';
import bcrypt from 'bcrypt';
import { generateCustomId } from '../utils/randomId.js';
import { UserType } from '../types/index.js';

class Users {
  // create new user
  async createUser(data: UserType) {
    try {
      // Hash user password before saving
      const newPass = await bcrypt.hash(data.userPassword.toString(), 10);

      const userData = { ...data, userPassword: newPass };

      // Generate custom user ID
      userData.userID = generateCustomId();

      // Save user in DB
      await UsersModel.create(userData);
    } catch (err) {
      if (err) {
        return;
      }
    }
  }

  // check if email exists
  async checkEmail(email: string) {
    try {
      // Find user by email
      const user = await UsersModel.findOne({ userEmail: email });
      return user;
    } catch {
      return null;
    }
  }

  // verify user login password
  async checkSigninPassword(userEmail: string, password: string) {
    // Find user by email
    const user = await UsersModel.findOne({
      userEmail: userEmail,
    });

    if (user !== null) {
      // Compare hashed password
      const match = await bcrypt.compare(password, user.userPassword.toString());

      return match;
    }
  }
}

export const userServices = new Users();
