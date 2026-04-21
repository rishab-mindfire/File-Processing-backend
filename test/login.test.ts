import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../src/index';

// Mock required modules
vi.mock('../src/services/users.service');
vi.mock('../src/services/authRole.service');

// Import the vi.mock calls
import * as userServices from '../src/services/users.service';
import * as authRoleService from '../src/services/authRole.service';

const request = supertest(app);

describe('User Login API Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 200 and return Bearer token on successful login', async () => {
    // mocked on the imported function
    vi.mocked(userServices.userServices.checkSigninPassword).mockResolvedValue(true);

    //add auth as admin
    vi.mocked(authRoleService.verifyEmplyeeRole).mockResolvedValue('admin');

    const payload = {
      userEmail: 'myaccount@gmail.com',
      password: '12345',
    };

    const response = await request.post('/user/login').send(payload);

    //Assert
    expect(response.status).toBe(200);
    expect(response.body.role).toBe('admin');
    expect(response.headers['authorization']).toContain('Bearer ');
  });
  //validate Email
  it('Email should valid formate', async () => {
    vi.mocked(userServices.userServices.checkSigninPassword).mockResolvedValue(false);

    const response = await request
      .post('/user/login')
      .send({ userEmail: 'myaccountgmail.com', password: '123456' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.details).toBe('userEmail must be a valid email');
  });
  //invalid wrong password
  it('should return 401 for invalid credentials on wrong credentials', async () => {
    vi.mocked(userServices.userServices.checkSigninPassword).mockResolvedValue(false);

    const response = await request
      .post('/user/login')
      .send({ userEmail: 'myaccount@gmail.com', password: 'wrongpassword' });

    //Assert
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });
});
