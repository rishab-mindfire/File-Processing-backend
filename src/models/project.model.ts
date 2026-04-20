import mongoose, { Schema } from 'mongoose';
import { IProject } from '../types/index.js';

const projectSchema = new Schema<IProject>(
  {
    projectName: { type: String, required: true, trim: true },
    projectDescription: { type: String },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexing owner
projectSchema.index({ owner: 1 });

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
