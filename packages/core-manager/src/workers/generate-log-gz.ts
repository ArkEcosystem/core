import { pipeline, Readable } from "stream";
import zlib from "zlib";

import { GenerateLog } from "./generate-log";
import { LogTransformStream } from "./log-transform-stream";

export class GenerateLogGz extends GenerateLog {
    public async execute(): Promise<void> {
        await new Promise((resolve, reject) => {
            const writeStream = this.prepareOutputStream();

            pipeline(
                Readable.from(this.database.getAllIterator("logs", this.options.query), { objectMode: true }),
                new LogTransformStream(),
                zlib.createGzip(),
                writeStream,
                (err) => {
                    if (err) {
                        writeStream.destroy();
                        this.removeTempFiles();

                        reject(err);
                    } else {
                        this.moveArchive();
                        resolve();
                    }
                },
            );
        });
    }
}
