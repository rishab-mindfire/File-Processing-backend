import { Request, Response } from 'express';
import { ProjectServices } from '../services/projects.service.js';
import { userServices } from '../services/users.service.js';
import { projectSchema } from '../validation/projectValidation.js';
import mongoose from 'mongoose';
import { parseError } from '../utils/parseError.js';

class projectClass {
  // create project
  createProject = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const { error, value } = projectSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.message.replace(/[\\"]/g, '') });
      }

      const { projectName, projectDescription } = value;

      // Get user email from request (set via auth middleware)
      const email = req.userEmail;
      if (!email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify user exists
      const user = await userServices.checkEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create new project linked to user
      const project = await ProjectServices.createNewProject({
        projectName,
        projectDescription,
        owner: user._id.toString(),
      });

      return res.status(201).json(project);
    } catch (error) {
      const { message, status } = parseError(error);
      return res.status(status).json({ error: message });
    }
  };

  // Update project based on project-ID
  updateProject = async (req: Request, res: Response) => {
    try {
      const id = req.params.projectId as string;

      // Validate projectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Validate request body before update
      const { error, value } = projectSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.message.replace(/[\\"]/g, '') });
      }

      // Perform update operation via service
      await ProjectServices.updateProject(id, value);
      res.status(200).json(value);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // Lists all projects
  listProjects = async (req: Request, res: Response) => {
    try {
      // Fetch all projects (can be scoped later per user)
      const projects = await ProjectServices.listAllProjects();

      res.status(200).json(projects);
    } catch (error) {
      const { message, status } = parseError(error);
      return res.status(status).json({ error: message });
    }
  };

  // Gets specific project details with fileCount and jobCount
  viewProject = async (req: Request, res: Response) => {
    const id = req.params.projectId as string;

    try {
      // Validate projectId before querying
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Fetch project with aggregated stats
      const projectWithStats = await ProjectServices.getProjectWithStats(id);

      if (!projectWithStats) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json(projectWithStats);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };

  // delete project
  deleteProject = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params as { projectId: string };

      // Call service to delete project and related resources
      const result = await ProjectServices.deleteProject(projectId);

      res.status(200).json(result);
    } catch (error) {
      const { message, status } = parseError(error);
      res.status(status).json({ error: message });
    }
  };
}

export const ProjectCtr = new projectClass();
