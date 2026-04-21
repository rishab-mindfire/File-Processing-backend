import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { NextFunction } from 'express';

// Import your new mock data
import {
  mockProjectResponse,
  mockUpdatedProject,
  mockProjectList,
  mockProjectWithStats,
  mockAuthUser,
} from './mock/mockData';

// Mock auth middleware
vi.mock('../src/middlewares/authRoleBased', () => ({
  default: () => (req: AuthRequest, _res: Response, next: NextFunction) => {
    req.userEmail = 'test@example.com';

    next();
  },
}));

// Mock services
vi.mock('../src/services/projects.service', () => ({
  ProjectServices: {
    createNewProject: vi.fn(),
    updateProject: vi.fn(),
    listAllProjects: vi.fn(),
    getProjectWithStats: vi.fn(),
  },
}));

vi.mock('../src/services/users.service', () => ({
  userServices: {
    checkEmail: vi.fn(),
  },
}));

import app from '../src/index';
import { ProjectServices } from '../src/services/projects.service';
import { userServices } from '../src/services/users.service';
import { AuthRequest } from '../src/types';

const request = supertest(app);

describe('Project API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a project when data is valid', async () => {
    vi.mocked(ProjectServices.createNewProject).mockResolvedValue(mockProjectResponse);
    vi.mocked(userServices.checkEmail).mockResolvedValue(mockAuthUser);

    const response = await request.post('/projects').send({
      projectName: 'Test Project',
      projectDescription: 'Integration testing with Vitest',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockProjectResponse);
  });

  it('should update a project when data is valid', async () => {
    vi.mocked(ProjectServices.updateProject).mockResolvedValue(mockUpdatedProject);

    //
    const response = await request.put(`/projects/${mockUpdatedProject!._id}`).send({
      projectName: 'Updated Project',
      projectDescription: 'Updated desc',
    });

    expect(response.status).toBe(200);
  });

  it('should list all projects', async () => {
    vi.mocked(ProjectServices.listAllProjects).mockResolvedValue(mockProjectList);

    const response = await request.get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProjectList);
  });

  it('should return project details with stats', async () => {
    vi.mocked(ProjectServices.getProjectWithStats).mockResolvedValue(mockProjectWithStats);

    const response = await request.get(`/projects/${mockProjectWithStats._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProjectWithStats);
  });
});
