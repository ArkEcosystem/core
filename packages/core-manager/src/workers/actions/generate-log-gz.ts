import dayjs from "dayjs";
import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname, join } from "path";
import { Readable, Transform, TransformCallback } from "stream";
import { Writable } from "stream";
import zlib from "zlib";

import { LogsResult } from "../../database/logs-database-service";
import { GenerateLog, Options } from "./generate-log";

class IterableStream extends Readable {
    public constructor(private readonly iterator: IterableIterator<any>) {
        super({ objectMode: true });
    }

    public _read(size: number) {
        const item = this.iterator.next();
        this.push(item.done ? null : item.value);
    }
}

class TransformStream extends Transform {
    public constructor() {
        super({ objectMode: true });
    }

    public _transform(chunk: any, encoding: string, callback: TransformCallback) {
        this.push(this.formatLog(chunk));
        callback();
    }

    private formatLog(log: LogsResult): string {
        return `[${dayjs.unix(log.timestamp).utc().format("YYYY-MM-DD HH:mm:ss.SSS")}] ${log.level.toUpperCase()} : ${
            log.content
        }\n`;
    }
}

export class GenerateLogGz extends GenerateLog {
    public constructor(options: Options) {
        super(options);
    }

    public async execute(): Promise<void> {
        const iterator = this.database.getAllIterator("logs", this.options.query);

        const readStream = new IterableStream(iterator);
        const writeStream = this.prepareOutputStream();

        readStream.pipe(new TransformStream()).pipe(writeStream);

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
