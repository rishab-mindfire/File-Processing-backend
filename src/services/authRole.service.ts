import { UsersModel } from '../models/users.model';

export async function verifyEmplyeeRole(email: string): Promise<string | null> {
  try {
    if (!email) {
      console.error('Email is missing');
      return null;
    }

    const user = await UsersModel.findOne(
      { userEmail: email },
      { role: 1, _id: 0 }
    ).lean();

    if (!user) {
      console.warn(`No user found for email: ${email}`);
      return null;
    }

    return user.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}
