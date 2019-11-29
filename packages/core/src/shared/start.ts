import cli from "cli-ux";

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

            processManager.start(
                {
                    ...options,
                    ...{
                        env: {
                            NODE_ENV: "production",
                            CORE_ENV: flags.env,
                        },
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
