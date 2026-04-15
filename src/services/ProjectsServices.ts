import mongoose from 'mongoose';
import FileModel from '../models/fileModel';
import JobModel from '../models/jobModel';
import ProjectModel from '../models/projectModel';

export class ProjectServices {
  static async createNewProject(data: {
    projectName: string;
    projectDescription?: string;
    owner: string;
  }) {
    const project = new ProjectModel(data);
    return await project.save();
  }

  // Get Project Details
  static async getProjectWithStats(projectId: string) {
    const id = new mongoose.Types.ObjectId(projectId);

    const stats = await ProjectModel.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'files', // Make sure this matches your Files collection name
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },
      {
        $lookup: {
          from: 'jobs', // Make sure this matches your Jobs collection name
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },
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

  // Lists all projects
  static async listAllProjects() {
    return await ProjectModel.aggregate([
      {
        $sort: { createdAt: -1 },
      },

      // Join files
      {
        $lookup: {
          from: 'filemodels',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      // Join jobs (ZIP)
      {
        $lookup: {
          from: 'jobmodels',
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

      // Add counts
      {
        $addFields: {
          totalFiles: { $size: '$files' },
          totalZips: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.type', 'ZIP_COMPRESSION'] },
              },
            },
          },
        },
      },

      // Remove heavy arrays
      {
        $project: {
          files: 0,
          jobs: 0,
        },
      },
    ]);
  }

  // Deletes a project and prepares for cascade delete
  static async deleteProject(projectId: string) {
    //check project id exist
    const exists = await ProjectModel.exists({ _id: projectId });
    // Validate
    if (!mongoose.Types.ObjectId.isValid(projectId) || !exists) {
      throw { status: 400, message: 'Invalid projectId' };
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw { status: 500, message: 'DB not connected' };
    }

    const bucket = new mongoose.mongo.GridFSBucket(db);

    //  Get files
    const files = await FileModel.find({ projectId });

    //  Delete from GridFS (parallel for speed)
    await Promise.all(
      files.map(async (file) => {
        try {
          if (file.fileId) {
            await bucket.delete(new mongoose.Types.ObjectId(file.fileId));
          }
        } catch (err) {
          console.error('GridFS delete error:', err);
          // don't throw → continue deleting others
        }
      }),
    );

    // Delete metadata
    await Promise.all([
      FileModel.deleteMany({ projectId }),
      JobModel.deleteMany({ projectId }),
      ProjectModel.findByIdAndDelete(projectId),
    ]);

    return { message: 'Project and all files deleted successfully' };
  }
}
