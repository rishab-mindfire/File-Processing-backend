import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';

// MIDDLEWARE import
vi.mock('../src/middlewares/authRoleBased', () => ({
  default: () => (req: any, res: any, next: any) => {
    req.userEmail = 'test@example.com';
    next();
  },
}));

// Mock services
vi.mock('../src/services/users');
vi.mock('../src/services/projectsServices');

// import files
import app from '../src/index';
import * as userServices from '../src/services/users';
import * as ProjectServices from '../src/services/projectsServices';

const request = supertest(app);

describe('Project Creation API Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // create project
  it('should create a project when data is valid', async () => {
    const mockProject = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d2',
      projectName: 'Test Project',
      projectDescription: 'Integration testing with Vitest',
      owner: '65f1a2b3c4d5e6f7a8b9c0d1',
    };

    // mock project and and add email _id form userservice
    vi.mocked(
      ProjectServices.ProjectServices.createNewProject,
    ).mockResolvedValue(mockProject as any);
    vi.mocked(userServices.userServices.checkEmail).mockResolvedValue({
      _id: '65f1a2b3c4d5e6f7a8b9c0d1',
      email: 'test@example.com',
    } as any);

    const payload = {
      projectName: 'Test Project',
      projectDescription: 'Integration testing with Vitest',
    };

    const response = await request.post('/projects').send(payload);

    //Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockProject);
  });
  it('should return 401 if userEmail is missing (auth fails)', async () => {
    //simulate missing email
    vi.mocked(
      ProjectServices.ProjectServices.createNewProject,
    ).mockResolvedValue({} as any);
    vi.mocked(userServices.userServices.checkEmail).mockResolvedValue(
      null as any,
    );

    const response = await request.post('/projects').send({
      projectName: 'Test Project',
    });

    expect(response.status).toBe(404);
  });
  it('should return 400 for invalid payload', async () => {
    const response = await request.post('/projects').send({
      projectName: '',
    });

    expect(response.status).toBe(400);
  });

  //update project
  it('should update a project when data is valid', async () => {
    const mockUpdatedProject = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d2',
      projectName: 'Updated Project',
      projectDescription: 'Updated desc',
    };

    vi.mocked(ProjectServices.ProjectServices.updateProject).mockResolvedValue(
      mockUpdatedProject as any,
    );

    const response = await request
      .put('/projects/65f1a2b3c4d5e6f7a8b9c0d2')
      .send({
        projectName: 'Updated Project',
        projectDescription: 'Updated desc',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUpdatedProject);
  });
  it('should return 404 for invalid projectId in update', async () => {
    const response = await request.put('/projects/invalid-id').send({
      projectName: 'Test',
    });
    expect(response.status).toBe(404);
  });

  //list project
  it('should list all projects', async () => {
    const mockProjects = [
      { _id: '1', projectName: 'P1' },
      { _id: '2', projectName: 'P2' },
    ];

    vi.mocked(
      ProjectServices.ProjectServices.listAllProjects,
    ).mockResolvedValue(mockProjects as any);

    const response = await request.get('/projects');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProjects);
  });

  //view project
  it('should return project details with stats', async () => {
    const mockProject = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d2',
      projectName: 'Test Project',
      fileCount: 5,
      jobCount: 10,
    };

    vi.mocked(
      ProjectServices.ProjectServices.getProjectWithStats,
    ).mockResolvedValue(mockProject as any);

    const response = await request.get('/projects/65f1a2b3c4d5e6f7a8b9c0d2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProject);
  });
  it('should return 404 if project not found', async () => {
    vi.mocked(
      ProjectServices.ProjectServices.getProjectWithStats,
    ).mockResolvedValue(null as any);

    const response = await request.get('/projects/65f1a2b3c4d5e6f7a8b9c0d2');

    expect(response.status).toBe(404);
  });
});
