import { Container } from "@arkecosystem/core-kernel";
import fs from "fs";
import { join } from "path";
import readline from "readline";
import { Actions } from "../contracts";

interface Params {
    name: string;
    useErrorLog: boolean;
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
                default: "core",
            },
            showError: {
                type: "boolean",
                default: false,
            },
        },
    };

    public async execute(params: Params): Promise<any> {
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
        const limit = 10;

        const result: string[] = [];

        for await (const line of rl) {
            console.log(`Line from file: ${line}`);

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
        return CanIncludeLineResult.ACCEPT;
    }

    private canIncludeLineByLogType(line: string, params: Params): CanIncludeLineResult {
        return CanIncludeLineResult.ACCEPT;
    }

    private canIncludeLineBySearchTerm(line: string, params: Params): CanIncludeLineResult {
        return CanIncludeLineResult.ACCEPT;
    }
}
