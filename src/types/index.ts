import mongoose, { Types } from 'mongoose';

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
  outputFileId?: mongoose.Types.ObjectId;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
//

export type FilePopulated = {
  name: string;
  size: number;
};

export type CompletedJobRaw = {
  _id: Types.ObjectId;
  completedAt?: Date;
  outputFileId?: Types.ObjectId | FilePopulated;
};
//
export interface SelectedFile {
  name: string;
  storagePath: string;
}

export type WorkerMessage =
  | { type: 'DONE'; name: string; outputPath: string; size: number }
  | { type: 'ERROR'; message: string };

export type FileDocType = {
  storagePath: string;
  name: string;
};
// error parse
export interface ParsedError {
  status: number;
  message: string;
}

// mock Testing Data
export type MockUser = Partial<UserType> & {
  _id: string;
};
export type MockUserEmail = {
  _id: Types.ObjectId;
  userEmail: string;
};
export interface AuthRequest extends Request {
  userEmail?: string;
}
export interface MockUserData {
  _id: string;
  email: string;
}
export interface MockProject {
  _id: string;
  projectName: string;
  projectDescription: string;
  owner: string;
}
