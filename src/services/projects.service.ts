import mongoose from 'mongoose';
import fs from 'fs';
import FileModel from '../models/file.model.js';
import JobModel from '../models/job.model.js';
import ProjectModel from '../models/project.model.js';
import { IProject } from '../types/index.js';

export class ProjectServices {
  // Create new project
  static async createNewProject(data: {
    projectName: string;
    projectDescription?: string;
    owner: string;
  }) {
    const project = new ProjectModel(data);
    return await project.save();
  }

  // List all projects with file/zip counts
  static async listAllProjects() {
    return await ProjectModel.aggregate([
      { $sort: { createdAt: -1 } },

      // Join files collection
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      // Join zip jobs collection
      {
        $lookup: {
          from: 'zipjobs',
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

      // Compute derived fields
      {
        $addFields: {
          totalFiles: { $size: '$files' }, // Count total files
          totalZips: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'COMPLETED'] }, // Only completed jobs
              },
            },
          },
        },
      },

      // Exclude unnecessary fields from response
      {
        $project: {
          files: 0,
          jobs: 0,
          owner: 0,
        },
      },
    ]);
  }

  // Update project
  static updateProject = async (id: string, data: IProject) => {
    return await ProjectModel.findByIdAndUpdate(
      id,
      { $set: data }, // Update only provided fields
      { new: true }, // Return updated document
    );
  };

  // Get project details with basic stats
  static async getProjectWithStats(projectId: string) {
    const id = new mongoose.Types.ObjectId(projectId);

    const stats = await ProjectModel.aggregate([
      { $match: { _id: id } }, // Match specific project

      // Join files
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      // Join jobs
      {
        $lookup: {
          from: 'zipjobs',
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

      // Shape final response
      {
        $project: {
          projectName: 1,
          projectDescription: 1,
          createdAt: 1,
          filesCount: { $size: '$files' },
          jobsCount: { $size: '$jobs' },
        },
      },
    ]);

    return stats[0];
  }

  // Delete project with cleanup
  static async deleteProject(projectId: string) {
    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw { status: 400, message: 'Invalid projectId' };
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // Fetch all associated files
    const files = await FileModel.find({ projectId });

    // Delete physical files from disk
    await Promise.all(
      files.map(async (file) => {
        try {
          if (file.storagePath && fs.existsSync(file.storagePath)) {
            await fs.promises.unlink(file.storagePath);
          }
        } catch (err) {
          if (err) {
            return;
          }
        }
      }),
    );

    // Cascade delete DB records
    await Promise.all([
      FileModel.deleteMany({ projectId }),
      JobModel.deleteMany({ projectId }),
      ProjectModel.findByIdAndDelete(projectId),
    ]);

    return {
      message: 'Project and all associated files and jobs deleted successfully',
    };
  }
}
