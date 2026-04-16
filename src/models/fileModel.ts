import mongoose, { Schema } from 'mongoose';
import { IFile } from '../types';

//
const fileSchema = new Schema<IFile>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    isGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexing project id
fileSchema.index({ projectId: 1 });

const FileModel = mongoose.model<IFile>('File', fileSchema);

export default FileModel;
