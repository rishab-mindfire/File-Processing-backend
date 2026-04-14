import jwt from "jsonwebtoken";

export function generateToken(user: any) {
  const secret = process.env.JWT_SECRETE;

  if (secret) return jwt.sign(user, secret, { expiresIn: 60 * 60 * 12 });
}
export function verifyTokenAndGetUser(token: any) {
  const secret = process.env.JWT_SECRETE;
  if (!token) return null;
  try {
    if (secret) return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
