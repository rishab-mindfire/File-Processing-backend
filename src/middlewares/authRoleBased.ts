import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyEmplyeeRole } from '../services/authRole.service';

declare global {
  namespace Express {
    interface Request {
      userEmail?: string;
    }
  }
}

function authRoleBased(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ message: 'Token not provided' });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Invalid token format' });
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error('JWT_SECRET is missing');
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, secret);
      } catch {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const userEmail = decoded.userEmail;

      if (!userEmail) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }

      //const userRole = await verifyEmplyeeRole(userEmail);
      const userRole = 'admin';

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'User not authorized' });
      }

      req.userEmail = userEmail;

      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  };
}
export default authRoleBased;
