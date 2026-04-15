import mongoose, { Schema } from 'mongoose';
import { IFile } from '../types';

const fileSchema = new Schema<IFile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    fileId: { type: Schema.Types.ObjectId, required: true }, // Points to fs.files
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    isGenerated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// indexing
fileSchema.index({ projectId: 1 });

const FileModel = mongoose.model<IFile>('FileModel', fileSchema);
export default FileModel;
