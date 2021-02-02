import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname, join } from "path";
import { Writable } from "stream";
import zlib from "zlib";

import { GenerateLog, Options } from "./generate-log";
import { IteratorToStream, LogTransformStream } from "./streams";

export class GenerateLogGz extends GenerateLog {
    public constructor(options: Options) {
        super(options);
    }

    public async execute(): Promise<void> {
        const iterator = this.database.getAllIterator("logs", this.options.query);

        const readStream = new IteratorToStream(iterator);
        const writeStream = this.prepareOutputStream();

        readStream.pipe(new LogTransformStream()).pipe(writeStream);

        await new Promise((resolve) => {
            writeStream.on("close", () => {
                resolve();
            });
        });

        ensureDirSync(dirname(this.getFilePath()));
        renameSync(this.getTempFilePath(), this.getFilePath());
    }

    private getFilePath(): string {
        return join(process.env.CORE_PATH_DATA!, "log-archive", this.options.logFileName);
    }

    private getTempFilePath(): string {
        return join(process.env.CORE_PATH_TEMP!, "log-archive", this.options.logFileName);
    }

    private prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.getTempFilePath()));

        const stream = zlib.createGzip();

        stream.pipe(createWriteStream(this.getTempFilePath()));

        return stream;
    }
}
