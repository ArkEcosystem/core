import { Container } from "@arkecosystem/core-kernel";
import fs from "fs";
import { join } from "path";
import readline from "readline";
import { Actions } from "../contracts";
import dayjs from "dayjs";

interface Params {
    name: string;
    useErrorLog: boolean;
    dateFrom?: number;
    dateTo?: number;
    logLevel?: string;
    contains?: string;
}

enum CanIncludeLineResult {
    ACCEPT,
    SKIP,
    END,
}

type CanIncludeLineMethod = (line: string, params) => CanIncludeLineResult;

@Container.injectable()
export class Action implements Actions.Action {
    public name = "log.log";

    public schema = {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
            useErrorLog: {
                type: "boolean",
            },
            dateFrom: {
                type: "number",
            },
            dateTo: {
                type: "number",
            },
            logLevel: {
                type: "string",
            },
            contains: {
                type: "string",
            },
        },
    };

    public async execute(params: Params): Promise<any> {
        params = {
            name: "ark-core",
            useErrorLog: false,
            ...params,
        };

        return this.queryLog(params);
    }

    private getLogStream(params: Params): readline.Interface {
        const logsPath = `${process.env.HOME}/.pm2/logs`;
        const filePath = join(logsPath, `${params.name}-${params.useErrorLog ? "error" : "out"}.log`);

        return readline.createInterface({
            input: fs.createReadStream(filePath),
        });
    }

    private async queryLog(params: Params): Promise<string[]> {
        const rl = this.getLogStream(params);

        let i = 0;
        const limit = 100;

        const result: string[] = [];

        for await (const line of rl) {
            const canIncludeLine = this.canIncludeLine(line, params);

            if (canIncludeLine === CanIncludeLineResult.ACCEPT) {
                result.push(line);
            } else if (canIncludeLine === CanIncludeLineResult.SKIP) {
                continue;
            } else {
                break;
            }

            if (i >= limit) {
                break;
            }

            i++;
        }

        return result;
    }

    private canIncludeLine(line, params: Params): CanIncludeLineResult {
        const canIncludeLineMethods: CanIncludeLineMethod[] = [
            this.canIncludeLineByTimestamp,
            this.canIncludeLineByLogType,
            this.canIncludeLineBySearchTerm,
        ];

        for (const canIncludeLine of canIncludeLineMethods) {
            const result = canIncludeLine(line, params);

            if (result !== CanIncludeLineResult.ACCEPT) {
                return result;
            }
        }

        return CanIncludeLineResult.ACCEPT;
    }

    private canIncludeLineByTimestamp(line: string, params: Params): CanIncludeLineResult {
        if (!params.dateFrom && !params.dateTo) {
            return CanIncludeLineResult.ACCEPT;
        }

        const lineTimestamp = dayjs(line.substring(1, 24));

        if (!lineTimestamp.isValid()) {
            return CanIncludeLineResult.SKIP;
        }

        if (params.dateTo && params.dateTo < lineTimestamp.unix()) {
            return CanIncludeLineResult.END;
        }

        if (params.dateFrom && params.dateFrom > lineTimestamp.unix()) {
            return CanIncludeLineResult.SKIP;
        }

        return CanIncludeLineResult.ACCEPT;
    }

    private canIncludeLineByLogType(line: string, params: Params): CanIncludeLineResult {
        if (!params.logLevel) {
            return CanIncludeLineResult.ACCEPT;
        }

        const lineLogLevel = line.substring(31, 31 + params.logLevel.length);

        if (params.logLevel.toUpperCase() !== lineLogLevel) {
            return CanIncludeLineResult.SKIP;
        }

        return CanIncludeLineResult.ACCEPT;
    }

    private canIncludeLineBySearchTerm(line: string, params: Params): CanIncludeLineResult {
        if (!params.contains) {
            return CanIncludeLineResult.ACCEPT;
        }

        return line.includes(params.contains) ? CanIncludeLineResult.ACCEPT : CanIncludeLineResult.SKIP;
    }
}
