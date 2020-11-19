import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ExecaSyncReturnValue, sync } from "execa";
import { join } from "path";

import { Actions } from "../contracts";

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
            showError: {
                type: "boolean",
            },
            fromLine: {
                type: "integer",
                minimum: 1,
            },
            range: {
                type: "integer",
                minimum: 1,
                maximum: 10000,
            },
        },
        required: ["name"],
    };

    public async execute(params: {
        name: string;
        fromLine?: number;
        range?: number;
        showError?: boolean;
    }): Promise<any> {
        return await this.getLog(params.name, params.fromLine, params.range, params.showError);
    }

    private getTotalLines(path: string): number {
        const response: ExecaSyncReturnValue = sync(`wc -l ${path}`, { shell: true });

        return parseInt(response.stdout);
    }

    private getLines(path: string, fromLine: number, range: number): string {
        const response: ExecaSyncReturnValue = sync(`sed -n '${fromLine},${fromLine + range}p' ${path}`, {
            shell: true,
        });

        return response.stdout;
    }

    private async getLog(
        name: string,
        fromLine: number = 1,
        range: number = 100,
        showError: boolean = false,
    ): Promise<any> {
        const logsPath = `${process.env.HOME}/.pm2/logs`;
        const filePath = join(logsPath, `${name}-${showError ? "error" : "out"}.log`);

        if (this.filesystem.exists(filePath)) {
            return {
                totalLines: this.getTotalLines(filePath),
                lines: this.getLines(filePath, fromLine, range),
            };
        }

        throw new Error("Cannot find log file");
    }
}
