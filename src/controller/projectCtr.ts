import { Request, Response } from 'express';

class projectClass {
  listProjects = async (req: Request, res: Response) => {};
  viewProject = async (req: Request, res: Response) => {};
  deleteProject = async (req: Request, res: Response) => {};
}
export const ProjectCtr = new projectClass();
