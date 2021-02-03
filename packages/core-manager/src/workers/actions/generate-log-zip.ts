import archiver from "archiver";
import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname, parse } from "path";
import { Writable, Readable } from "stream";

import { GenerateLog } from "./generate-log";
import { LogTransformStream } from "./streams";

export class GenerateLogZip extends GenerateLog {
    public async execute(): Promise<void> {
        const readStream = Readable.from(this.database.getAllIterator("logs", this.options.query), {objectMode: true});
        const writeStream = this.prepareOutputStream();

        const archive = archiver("zip", {
            zlib: { level: 9 },
        });
        archive.pipe(writeStream);

        archive.append(
            readStream.pipe(
                new LogTransformStream(),
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
