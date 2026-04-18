import mongoose from 'mongoose';

// User Registration
export interface UserType {
  userID: string;
  userName: string;
  userEmail: string;
  userPassword: string;
  role: string;
}

// User Login
export interface IUserLogin {
  userEmail: string;
  userPassword: string;
}

// Project
export interface IProject {
  projectName: string;
  projectDescription?: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// File (Physical Disk Version)
// Note: Removed "extends Document" for cleaner Schema mapping
export interface IFile {
  projectId: mongoose.Types.ObjectId;
  name: string;
  storagePath: string; // Absolute path on server disk
  size: number;
  mimeType: string;
  isGenerated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Job (Zip Compression)
export interface IJob {
  projectId: mongoose.Types.ObjectId;
  type: 'ZIP_COMPRESSION';
  size: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  outputFileId?: mongoose.Types.ObjectId; // Points to the _id in File collection
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
