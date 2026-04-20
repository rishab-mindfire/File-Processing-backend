import { UsersModel } from '../models/users.model.js';

// Fetch user role based on email
export async function verifyEmplyeeRole(email: string): Promise<string | null | undefined> {
  try {
    if (!email) {
      return null;
    }

    // Query only required field role
    const user = await UsersModel.findOne({ userEmail: email }, { role: 1, _id: 0 }).lean();

    if (!user) {
      return null;
    }

    return user.role || null;
  } catch (err) {
    if (err) {
      return null;
    }
  }
}
