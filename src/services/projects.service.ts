// Project Management Service Module
// Orchestrates project lifecycles including creation, aggregation of stats, and updates
// Manages cascade deletions by cleaning up physical storage and related database records
// Utilizes MongoDB aggregation pipelines for high-performance data joining and filtering
import mongoose from 'mongoose';
import fs from 'fs';
import FileModel from '../models/file.model.js';
import JobModel from '../models/job.model.js';
import ProjectModel from '../models/project.model.js';
import { IProject } from '../types/index.js';

export class ProjectServices {
  // Persists a new project record to the database with provided metadata
  static async createNewProject(data: {
    projectName: string;
    projectDescription?: string;
    owner: string;
  }) {
    const project = new ProjectModel(data);
    return await project.save();
  }

  // Retrieves a summarized list of all projects including calculated file and ZIP totals
  static async listAllProjects() {
    return await ProjectModel.aggregate([
      // Sort projects by newest first
      { $sort: { createdAt: -1 } },

      // Join with files collection to calculate total file counts
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      // Join with zipjobs collection to calculate successful export counts
      {
        $lookup: {
          from: 'zipjobs',
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

      // Calculate derived metrics using embedded document arrays
      {
        $addFields: {
          totalFiles: { $size: '$files' },
          totalZips: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'COMPLETED'] },
              },
            },
          },
        },
      },

      // Clean up the output by removing raw joined data and sensitive owner info
      {
        $project: {
          files: 0,
          jobs: 0,
          owner: 0,
        },
      },
    ]);
  }

  // Applies partial or full updates to an existing project document by ID
  static updateProject = async (id: string, data: IProject) => {
    return await ProjectModel.findByIdAndUpdate(
      id,
      { $set: data }, // Safely update only the fields provided in the request
      { new: true }, // Return the modified document instead of the original
    );
  };

  // Fetches a single project document with real-time aggregate statistics
  static async getProjectWithStats(projectId: string) {
    const id = new mongoose.Types.ObjectId(projectId);

    const stats = await ProjectModel.aggregate([
      // Target the specific project in the pipeline
      { $match: { _id: id } },

      // Join associated file metadata
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      // Join associated background job history
      {
        $lookup: {
          from: 'zipjobs',
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

      // Project final view for the details page dashboard
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

  // Performs a deep cleanup of a project by purging disk assets and cascading DB deletes
  static async deleteProject(projectId: string) {
    // Ensure the ID is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw { status: 400, message: 'Invalid projectId' };
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // Identify all assets linked to this project before DB records are purged
    const files = await FileModel.find({ projectId });

    // Remove physical assets from the server storage asynchronously
    await Promise.all(
      files.map(async (file) => {
        try {
          if (file.storagePath && fs.existsSync(file.storagePath)) {
            await fs.promises.unlink(file.storagePath);
          }
        } catch (err) {
          // Swallow errors to ensure DB cleanup continues even if disk removal fails
          if (err) {
            return;
          }
        }
      }),
    );

    // Atomically delete all metadata across related collections
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
