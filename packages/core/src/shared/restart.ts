import Command from "@oclif/command";
import cli from "cli-ux";

import { parseWithNetwork } from "../common/parser";
import { abortMissingProcess, abortStoppedProcess } from "../common/process";
import { processManager } from "../common/process-manager";

export abstract class AbstractRestartCommand extends Command {
    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(this.getClass()));

        const processName = `${flags.token}-${this.getSuffix()}`;

        abortMissingProcess(processName);
        abortStoppedProcess(processName);

        cli.action.start(`Restarting ${processName}`);

        processManager.restart(processName);

        cli.action.stop();
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
