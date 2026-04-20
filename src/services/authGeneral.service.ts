import jwt from 'jsonwebtoken';

// Generate JWT token for authenticated user
export function generateToken(user: { userEmail: string }) {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return jwt.sign(user, secret, {
      expiresIn: 60 * 60 * 12,
    });
  }
}

// Verify token and return decoded user payload
export function verifyTokenAndGetUser(token: string) {
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err) {
      return null;
    }
  }
}
