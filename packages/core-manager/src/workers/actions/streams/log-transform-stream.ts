import { Transform, TransformCallback } from "stream";
import { LogsResult } from "../../../database/logs-database-service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export class LogTransformStream extends Transform {
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
