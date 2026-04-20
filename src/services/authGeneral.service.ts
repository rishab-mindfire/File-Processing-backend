import jwt from 'jsonwebtoken';

export function generateToken(user: any) {
  const secret = 'DLCEOeL8Xf5TMDBaWnFeVAL86GoAEwdRjERMdO84Dg5';

  if (secret) return jwt.sign(user, secret, { expiresIn: 60 * 60 * 12 });
}

export function verifyTokenAndGetUser(token: any) {
  const secret = 'DLCEOeL8Xf5TMDBaWnFeVAL86GoAEwdRjERMdO84Dg5';
  if (!token) return null;
  try {
    if (secret) return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
