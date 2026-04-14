import { Router } from 'express';
import { ProjectCtr } from '../controller/projectCtr';

export const projectRoute = Router();
projectRoute.get('/', ProjectCtr.listProjects);
projectRoute.get('/projects/:projectID', ProjectCtr.viewProject);
