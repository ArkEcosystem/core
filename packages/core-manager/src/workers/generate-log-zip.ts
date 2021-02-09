import archiver from "archiver";
import { parse } from "path";
import { pipeline, Readable } from "stream";

import { GenerateLog } from "./generate-log";
import { LogTransformStream } from "./log-transform-stream";

export class GenerateLogZip extends GenerateLog {
    public async execute(): Promise<void> {
        await new Promise(async (resolve, reject) => {
            const writeStream = this.prepareOutputStream();

            writeStream.on("close", () => {
                resolve();
            });

            const archive = archiver("zip", {
                zlib: { level: 9 },
            });

            const handleError = (err) => {
                writeStream.removeAllListeners("close");

                archive.abort();
                writeStream.destroy();
                this.removeTempFiles();

                reject(err);
            };

            archive.on("error", (err) => {
                handleError(err);
            });

            const readStream = pipeline(
                Readable.from(this.database.getAllIterator("logs", this.options.query), {
                    objectMode: true,
                }),
                new LogTransformStream(),
                (err) => {
                    if (err) {
                        handleError(err);
                    }
                },
            );

            archive.pipe(writeStream);
            archive.append(readStream, {
                name: parse(this.options.logFileName).name + ".log",
            });

            archive.finalize();
        });

        this.moveArchive();
    }
}
