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
  // Destructure input data passed from the main thread
  const { files, projectId, outputDir } = workerData;

  try {
    // Setup the output zip file path with a unique timestamp
    const zipName = `project_${projectId}_${Date.now()}.zip`;
    const outputPath = path.join(outputDir, zipName);

    // Initialize write stream and archiver (compression level 9 for max efficiency)
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Handle stream completion
    output.on('close', () => {
      parentPort.postMessage({
        type: 'DONE',
        outputPath: outputPath,
        name: zipName,
        size: archive.pointer(),
      });
    });

    // Handle archiver errors
    archive.on('error', (err) => {
      throw err;
    });

    // Connect (pipe) the archive data to the physical file stream
    archive.pipe(output);

    // Iterate through requested files and append to archive
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        // Use ReadStreams to keep memory usage low even for large files
        archive.append(fs.createReadStream(file.path), { name: file.name });
      } else {
        console.warn(`[Worker] File not found, skipping: ${file.path}`);
      }
    }

    // Finalize the archive (triggers the 'close' event on the output stream)
    await archive.finalize();
  } catch (err) {
    // Report failure back to main thread
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during zipping';
    parentPort?.postMessage({ type: 'ERROR', message: errorMessage });

    // Exit worker with error code
    process.exit(1);
  }
}

// Execute the worker
run();
