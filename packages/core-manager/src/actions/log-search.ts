import { Container, Contracts } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
import fs from "fs";
import { join } from "path";
import readline from "readline";

import { Actions } from "../contracts";

interface Params {
    name: string;
    useErrorLog: boolean;
    dateFrom?: number;
    dateTo?: number;
    logLevel?: string;
    contains?: string;
}

interface Line {
    timestamp?: number;
    level?: string;
    content: string;
}

enum CanIncludeLineResult {
    ACCEPT,
    SKIP,
    END, // Prevent further search
}

type CanIncludeLineMethod = (line: string, params) => CanIncludeLineResult;

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    public name = "log.search";

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

    private async getLogStream(params: Params): Promise<readline.Interface> {
        const logsPath = `${process.env.HOME}/.pm2/logs`;
        const filePath = join(logsPath, `${params.name}-${params.useErrorLog ? "error" : "out"}.log`);

        if (!(await this.filesystem.exists(filePath))) {
            throw new Error("Cannot find log file");
        }

        return readline.createInterface({
            input: fs.createReadStream(filePath),
        });
    }

    private async queryLog(params: Params): Promise<Line[]> {
        const rl = await this.getLogStream(params);

        let i = 0;
        const limit = 100;

        const result: Line[] = [];

        for await (const line of rl) {
            const canIncludeLine = this.canIncludeLine(line, params);

            if (canIncludeLine === CanIncludeLineResult.ACCEPT) {
                result.push(this.parseLine(line));
            } else if (canIncludeLine === CanIncludeLineResult.SKIP) {
                continue;
            } else {
                break;
            }

            if (++i === limit) {
                break;
            }
        }

        rl.close();

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

    private parseLine(line: string): Line {
        const result: Line = {
            timestamp: undefined,
            level: undefined,
            content: "",
        };

        const timestampRaw = dayjs(line.substring(1, 24));
        if (timestampRaw.isValid()) {
            result.timestamp = timestampRaw.unix();
        }

        result.level = this.parseLevel(line);

        if (result.timestamp && result.level) {
            result.content = line.substring(31 + result.level.length + 12, line.length - 5);

            result.level = result.level.trim();
        } else {
            result.content = line;
        }

        return result;
    }

    private parseLevel(line): string | undefined {
        let level = "";

        for (let i = 31; i < 41; i++) {
            if (line.length > i && ((line[i] >= "A" && line[i] <= "Z") || line[i] === " ")) {
                level += line[i];
            } else {
                break;
            }
        }

        return level.length ? level : undefined;
    }
}
