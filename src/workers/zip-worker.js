const { parentPort, workerData } = require('worker_threads');
const mongoose = require('mongoose');
const archiver = require('archiver');

async function run() {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(workerData.dbUri);
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');

    const bucket = new mongoose.mongo.GridFSBucket(db);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const zipName = `project_${workerData.projectId}_${Date.now()}.zip`;
    const uploadStream = bucket.openUploadStream(zipName);

    uploadStream.on('finish', async () => {
      parentPort.postMessage({
        type: 'DONE',
        gridFsId: uploadStream.id.toString(),
        name: zipName,
        size: uploadStream.length,
      });

      await mongoose.connection.close();
      process.exit(0);
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(uploadStream);

    for (const file of workerData.files) {
      const downloadStream = bucket.openDownloadStream(
        new mongoose.Types.ObjectId(file.fileId),
      );
      archive.append(downloadStream, { name: file.name });
    }

    await archive.finalize();
  } catch (err) {
    parentPort.postMessage({ type: 'ERROR', message: err.message });
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();
