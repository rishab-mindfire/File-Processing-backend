import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '../types';

const jobSchema = new Schema<IJob>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    type: {
      type: String,
      enum: ['ZIP_COMPRESSION'],
      default: 'ZIP_COMPRESSION',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    outputFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// Indexing project id and status
jobSchema.index({ projectId: 1, status: 1 });

const JobModel = mongoose.model<IJob>('zipJob', jobSchema);
export default JobModel;
