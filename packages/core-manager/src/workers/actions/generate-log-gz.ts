import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname } from "path";
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
