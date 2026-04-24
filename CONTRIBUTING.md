# Contributing to Project-Centric File Backend

Thank you for your interest in contributing! This project is a specialized Node.js backend designed to handle project-based file management and heavy background processing using Worker Threads.

---

## Prerequisites

Before you start, ensure you have the following installed:
- **Node.js**: v18.x or higher (required for stable `worker_threads` support).
- **MongoDB**: v6.0+ (Local instance or MongoDB Atlas).
- **Package Manager**: npm or yarn.

---

## Development Setup

1. **Fork the Repository**: Create a personal copy on GitHub.
2. **Clone the Project**:
   ```bash
   git clone https://github.com/rishab-mindfire/File-Processing-backend
   cd File-Processing-backend


   Environment Configuration:
Create a .env.dev file in the root directory:

Code snippet

PORT=5000
MONGO_URI=mongodb://localhost:27017/project_db
UPLOAD_DIR=./uploads
NODE_ENV=development
Install Dependencies:

Bash
```
npm install
Start the Server:

Bash
npm run dev
```

 ## Architectural Guidelines
To ensure the system remains scalable and stable, please follow these core principles:

1. File Handling & Storage
Local Disk Strategy: Files are stored in project-specific subdirectories: ${UPLOAD_DIR}/${projectId}/${fileId}.

Database Consistency: Every physical file must have a corresponding entry in the Files collection.

Cleanup: When deleting a file or project, you must use the fs.rm or fs.unlink module to remove the physical data from the disk.

2. Background Jobs (Worker Threads)
Non-Blocking IO: Never perform ZIP compression or large file parsing on the main Express thread.

Worker Responsibility: Use the worker_threads module for ZIP_COMPRESSION jobs.

Job Status: Workers are responsible for updating the status (PENDING -> PROCESSING -> COMPLETED/FAILED) and progress (0-100) in MongoDB.

3. API Standards
RESTful Design: Ensure endpoints follow the project-centric hierarchy (e.g., /api/projects/:id/files).

Input Validation: Validate all incoming projectId and fileId parameters (UUID/ObjectId format).

 Coding Standards
TypeScript/ES6: Use modern syntax. Prefer async/await over raw promises.

## Clean Code:

Remove all console.log() statements before submitting a PR.

Use clear, descriptive variable names.

Error Handling: Every controller must use a try-catch block that passes errors to the global error-handling middleware.

 Git Workflow
Branching:

Features: feat/feature-name

Bug Fixes: fix/issue-description

Documentation: docs/update-info

Commit Messages: Follow conventional commits (e.g., feat: implement project-specific zip logic).

Pull Requests: Provide a clear description of the changes and link any related issues.

 Platform Note
Note that this backend is designed for Persistent Environments (VPS/Docker/Dedicated Servers). It is currently incompatible with Vercel/Serverless due to the reliance on local fs storage and long-running Worker Threads.

