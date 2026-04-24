/**
 * @file ZipWorker.js
 * @description Background worker thread responsible for compressing project files into a ZIP archive.
 * * Responsibilities:
 * - Reads file metadata from workerData.
 * - Streams files from the filesystem into an archiver instance.
 * - Reports progress and completion back to the main thread via parentPort.
 * - Handles errors gracefully to prevent the main process from crashing.
 * * Thread Safety:
 * This runs in an isolated thread. It should not attempt to access shared memory
 * outside of the provided workerData or global Node objects.
 */

const { parentPort, workerData } = require('worker_threads');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * Main execution function for the worker thread.
 */
async function run() {
  // Get outputPath from workerData (provided by JobService)
  const { files, outputPath } = workerData;

  try {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      parentPort.postMessage({
        type: 'DONE',
        size: archive.pointer(),
      });
    });

    archive.pipe(output);

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        archive.append(fs.createReadStream(file.path), { name: file.name });
      }
    }

    await archive.finalize();
  } catch (err) {
    parentPort?.postMessage({ type: 'ERROR', message: err.message });
    process.exit(1);
  }
}

// Execute the worker
run();
