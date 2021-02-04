import { createWriteStream, ensureDirSync, removeSync, renameSync } from "fs-extra";
import { dirname } from "path";
import { pipeline, Readable, Writable } from "stream";
import zlib from "zlib";

import { GenerateLog } from "./generate-log";
import { LogTransformStream } from "./log-transform-stream";

export class GenerateLogGz extends GenerateLog {
    public async execute(): Promise<void> {
        const writeStream = this.prepareOutputStream();

        pipeline(
            Readable.from(this.database.getAllIterator("logs", this.options.query), { objectMode: true }),
            new LogTransformStream(),
            zlib.createGzip(),
            writeStream,
            (err) => {
                if (err) {
                    writeStream.destroy();
                    removeSync(this.getTempFilePath());

                    throw err;
                } else {
                    this.moveArchive();
                }
            },
        );
    }

    private moveArchive(): void {
        ensureDirSync(dirname(this.getFilePath()));
        renameSync(this.getTempFilePath(), this.getFilePath());
    }

    private prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.getTempFilePath()));

        return createWriteStream(this.getTempFilePath());
    }
}
