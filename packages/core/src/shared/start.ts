import cli from "cli-ux";

import { freemem, totalmem } from "os";
import { BaseCommand } from "../commands/command";
import { processManager } from "../process-manager";
import { CommandFlags, ProcessOptions } from "../types";

export abstract class AbstractStartCommand extends BaseCommand {
    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(this.getClass());

        return this.runProcess(flags);
    }

    public abstract getClass();

    protected abstract async runProcess(flags: CommandFlags): Promise<void>;

    protected async runWithPm2(options: ProcessOptions, flags: CommandFlags) {
        const processName: string = options.name;

        try {
            if (processManager.has(processName)) {
                this.abortUnknownProcess(processName);
                this.abortRunningProcess(processName);
            }

            cli.action.start(`Starting ${processName}`);

            const flagsProcess: Record<string, boolean | number | string> = {
                "max-restarts": 5,
                "kill-timeout": 30000,
            };

            if (flags.daemon === false) {
                flagsProcess["no-daemon"] = true;
            }

            flagsProcess.name = processName;

            const totalMemGb: number = totalmem() / Math.pow(1024, 3);
            const freeMemGb: number = freemem() / Math.pow(1024, 3);
            const potato: boolean = totalMemGb < 2 || freeMemGb < 1.5;

            processManager.start(
                {
                    ...options,
                    ...{
                        env: {
                            NODE_ENV: "production",
                            CORE_ENV: flags.env,
                        },
                        node_args: potato ? "--max_old_space_size=500" : undefined,
                    },
                },
                flagsProcess,
            );
        } catch (error) {
            error.stderr ? this.error(`${error.message}: ${error.stderr}`) : this.error(error.message);
        } finally {
            cli.action.stop();
        }
    }
}
