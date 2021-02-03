import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname } from "path";
import { Writable, Readable } from "stream";
import zlib from "zlib";

import { GenerateLog } from "./generate-log";
import { LogTransformStream } from "./log-transform-stream";

export class GenerateLogGz extends GenerateLog {
    public async execute(): Promise<void> {
        const readStream = Readable.from(this.database.getAllIterator("logs", this.options.query), { objectMode: true });
        const writeStream = this.prepareOutputStream();

        readStream.pipe(new LogTransformStream()).pipe(writeStream);
        await this.resolveOnClose(writeStream);

        ensureDirSync(dirname(this.getFilePath()));
        renameSync(this.getTempFilePath(), this.getFilePath());
    }

    private prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.getTempFilePath()));

        const stream = zlib.createGzip();
        stream.pipe(createWriteStream(this.getTempFilePath()));

        return stream;
    }
}
