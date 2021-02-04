import archiver from "archiver";
import { createWriteStream, ensureDirSync, removeSync, renameSync } from "fs-extra";
import { dirname, parse } from "path";
import { pipeline, Readable, Writable } from "stream";

import { GenerateLog } from "./generate-log";
import { LogTransformStream } from "./log-transform-stream";

export class GenerateLogZip extends GenerateLog {
    public async execute(): Promise<void> {
        const writeStream = this.prepareOutputStream();

        const archive = archiver("zip", {
            zlib: { level: 9 },
        });

        const handleError = (err) => {
            archive.abort();
            writeStream.destroy();
            removeSync(this.getTempFilePath());

            throw err;
        };

        archive.on("error", function (err) {
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

        await this.resolveOnClose(writeStream);

        ensureDirSync(dirname(this.getFilePath()));
        renameSync(this.getTempFilePath(), this.getFilePath());
    }

    private prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.getTempFilePath()));

        return createWriteStream(this.getTempFilePath());
    }
}
