import archiver from "archiver";
import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname, parse } from "path";
import { Writable } from "stream";

import { GenerateLog, Options } from "./generate-log";
import { IteratorToStream, LogTransformStream } from "./streams";

export class GenerateLogZip extends GenerateLog {
    public constructor(options: Options) {
        super(options);
    }

    public async execute(): Promise<void> {
        const iterator = this.database.getAllIterator("logs", this.options.query);

        const readStream = new IteratorToStream(iterator);
        const writeStream = this.prepareOutputStream();

        const archive = archiver("zip", {
            zlib: { level: 9 },
        });
        archive.pipe(writeStream);

        archive.append(
            readStream.pipe(
                new LogTransformStream({
                    writableObjectMode: true,
                }),
            ),
            { name: parse(this.options.logFileName).name + ".log" },
        );

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
