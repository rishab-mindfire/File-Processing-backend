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
      console.log('AUTH HIT');

      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).send('No token');

      const token = authHeader.split(' ')[1];
      if (!token) return res.status(401).send('Bad token');

      const decoded: any = jwt.verify(token, 'hardcoded_secret');

      console.log('DECODED:', decoded);

      req.userEmail = decoded.userEmail;

      next();
    } catch (err) {
      console.error('AUTH ERROR:', err);
      return res.status(500).send('Auth failed');
    }
  };
}

export default authRoleBased;
