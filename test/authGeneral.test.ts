import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { mockDecodedUser, mockJwtSecret, mockJwtToken } from './mock/mockData';
import { generateToken, verifyTokenAndGetUser } from '../src/services/authGeneral.service';

vi.mock('jsonwebtoken');

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', mockJwtSecret);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateToken', () => {
    it('should return a token when JWT_SECRET is present', () => {
      const user = { userEmail: 'test@example.com' };
      vi.mocked(jwt.sign).mockReturnValue(mockJwtToken as string & void);

      const token = generateToken(user);

      expect(token).toBe(mockJwtToken);
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyTokenAndGetUser', () => {
    it('should return decoded payload for a valid token', () => {
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedUser as unknown as JwtPayload & void);

      const result = verifyTokenAndGetUser(mockJwtToken);

      expect(result).toEqual(mockDecodedUser);
      // Now result.userEmail is accessible without 'any' if you cast the result
      expect((result as JwtPayload).userEmail).toBe('test@example.com');
    });

    it('should return null if jwt.verify throws an error', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = verifyTokenAndGetUser('invalid-token');
      expect(result).toBeNull();
    });
  });
});
