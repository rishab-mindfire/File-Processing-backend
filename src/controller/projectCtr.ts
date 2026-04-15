import { Request, Response } from 'express';
import { ProjectServices } from '../services/projectsServices';
import { userServices } from '../services/users';
import { createProjectSchema } from '../Validation/projectValidation';

class projectClass {
  // create project
  createProject = async (req: Request, res: Response) => {
    try {
      const { error, value } = createProjectSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: error.message,
        });
      }
      const { projectName, projectDescription } = value;
      const email = req.userEmail;
      if (!email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await userServices.checkEmail(email as string);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!projectName) {
        return res.status(404).json({ error: 'Project name required' });
      }

      // Create project with the user id found in token
      const project = await ProjectServices.createNewProject({
        projectName: projectName,
        projectDescription: projectDescription,
        owner: (user as any)._id,
      });

      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Lists all projects
  listProjects = async (req: Request, res: Response) => {
    try {
      const projects = await ProjectServices.listAllProjects();
      res.status(200).json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // Gets specific project details with fileCount and jobCount
  viewProject = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const projectWithStats = await ProjectServices.getProjectWithStats(id);

      if (!projectWithStats) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json(projectWithStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
  // delete project
  deleteProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      const result = await ProjectServices.deleteProject(id);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Delete project error:', error);

      res.status(error.status || 500).json({
        error: error.message || 'Internal Server Error',
      });
    }
  };
}

export const ProjectCtr = new projectClass();
