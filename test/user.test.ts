import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';

// ✅ Mock services
vi.mock('../src/services/users');
vi.mock('../src/services/authGeneral');
vi.mock('../src/services/authRole');

// ✅ Imports AFTER mocks
import app from '../src/index';
import * as userServices from '../src/services/users';
import * as authGeneral from '../src/services/authGeneral';
import * as authRole from '../src/services/authRole';

const request = supertest(app);

describe('User API Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  //LOGIN SUCCESS
  it('should login and return token', async () => {
    vi.mocked(userServices.userServices.checkSigninPassword).mockResolvedValue(
      true,
    );
    vi.mocked(authGeneral.generateToken).mockReturnValue('mocked-token' as any);
    vi.mocked(authRole.verifyEmplyeeRole).mockResolvedValue('admin');

    const response = await request.post('/user/login').send({
      userEmail: 'test@gmail.com',
      password: '12345',
    });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('admin');
    expect(response.headers['authorization']).toBe('Bearer mocked-token');
  });

  //LOGIN VALIDATION FAIL
  it('should return 400 for invalid email format', async () => {
    const response = await request.post('/user/login').send({
      userEmail: 'invalid-email',
      password: '12345',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  //INVALID CREDENTIALS
  it('should return 401 for wrong credentials', async () => {
    vi.mocked(userServices.userServices.checkSigninPassword).mockResolvedValue(
      false,
    );

    const response = await request.post('/user/login').send({
      userEmail: 'test@gmail.com',
      password: 'wrong',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  //REGISTRATION SUCCESS
  it('should register user successfully', async () => {
    vi.mocked(userServices.userServices.checkEmail).mockResolvedValue(
      null as any,
    );
    vi.mocked(userServices.userServices.createUser).mockResolvedValue(
      {} as any,
    );

    const response = await request.post('/user/register').send({
      userName: 'rishab',
      role: 'admin',
      userEmail: 'new@gmail.com',
      password: '12345',
    });

    expect(response.status).toBe(201);
    expect(response.text).toBe('user created successfully !');
  });

  //EMAIL EXISTS
  it('should return 409 if email already exists', async () => {
    vi.mocked(userServices.userServices.checkEmail).mockResolvedValue({
      _id: 'user1',
    } as any);

    const response = await request.post('/user/register').send({
      userName: 'rishab',
      role: 'admin',
      userEmail: 'existing@gmail.com',
      password: '12345',
    });

    expect(response.status).toBe(409);
    expect(response.text).toBe('Email allready exists !');
  });
});
