import mongoose from 'mongoose';
import fs from 'fs';
import FileModel from '../models/fileModel';
import JobModel from '../models/jobModel';
import ProjectModel from '../models/projectModel';

export class ProjectServices {
  //Create Project
  static async createNewProject(data: {
    projectName: string;
    projectDescription?: string;
    owner: string;
  }) {
    const project = new ProjectModel(data);
    return await project.save();
  }

  // Lists all projects with file/zip counts
  static async listAllProjects() {
    return await ProjectModel.aggregate([
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      {
        $lookup: {
          from: 'zipjobs',
          localField: '_id',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

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

      {
        $project: {
          files: 0,
          jobs: 0,
          owner: 0,
        },
      },
    ]);
  }

  //update project
  static updateProject = async (id: string, data: any) => {
    return await ProjectModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    );
  };

  // Get Project Details with basic stats
  static async getProjectWithStats(projectId: string) {
    const id = new mongoose.Types.ObjectId(projectId);

    const stats = await ProjectModel.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: 'projectId',
          as: 'files',
        },
      },
      {
        $lookup: {
          from: 'zipjobs',
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

  // delete project with clean-up
  static async deleteProject(projectId: string) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw { status: 400, message: 'Invalid projectId' };
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // delete all file records
    const files = await FileModel.find({ projectId });

    // Delete actual physical files from Disk
    await Promise.all(
      files.map(async (file) => {
        try {
          if (file.storagePath && fs.existsSync(file.storagePath)) {
            await fs.promises.unlink(file.storagePath);
          }
        } catch (err) {
          console.error(`Failed to delete disk file: ${file.storagePath}`, err);
        }
      }),
    );

    // Delete metadata from Database (Cascade)
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
