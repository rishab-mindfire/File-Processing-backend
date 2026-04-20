"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { parentPort, workerData } = require('worker_threads');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const { files, projectId, outputDir } = workerData;
        try {
            // Setup the output zip file path
            const zipName = `project_${projectId}_${Date.now()}.zip`;
            const outputPath = path.join(outputDir, zipName);
            // Create write stream for the ZIP file
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            // Listen for completion
            output.on('close', () => {
                parentPort.postMessage({
                    type: 'DONE',
                    outputPath: outputPath,
                    name: zipName,
                    size: archive.pointer(),
                });
            });
            archive.on('error', (err) => {
                throw err;
            });
            // Pipe archive data to the file stream
            archive.pipe(output);
            //  Append files from local disk
            for (const file of files) {
                // file.path is the absolute path passed
                if (fs.existsSync(file.path)) {
                    archive.append(fs.createReadStream(file.path), { name: file.name });
                }
                else {
                    console.warn(`File not found, skipping: ${file.path}`);
                }
            }
            yield archive.finalize();
        }
        catch (err) {
            parentPort.postMessage({ type: 'ERROR', message: err.message });
            process.exit(1);
        }
    });
}
run();
//# sourceMappingURL=zip-worker.js.map