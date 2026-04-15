import mongoose from 'mongoose';

//user registration
export interface UserType {
  userID: string;
  userName: string;
  userEmail: string;
  password: string;
  role: string;
}
//user login
export interface IUserLogin {
  userEmail: string;
  password: string;
}

//
// project
export interface IProject {
  projectName: string;
  projectDescription?: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

///file
export interface MulterFile {
  originalname: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface IFile extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  fileId: mongoose.Types.ObjectId; // GridFS reference
  size: number;
  mimeType: string;
  isGenerated: boolean;
}

// zip

export interface IJob extends Document {
  projectId: mongoose.Types.ObjectId;
  type: 'ZIP_COMPRESSION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  outputFileId?: mongoose.Types.ObjectId;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
