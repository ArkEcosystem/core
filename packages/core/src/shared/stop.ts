import Command from "@oclif/command";
import cli from "cli-ux";

import { parseWithNetwork } from "../common/parser";
import { abortMissingProcess, abortStoppedProcess, abortUnknownProcess } from "../common/process";
import { processManager } from "../common/process-manager";

export abstract class AbstractStopCommand extends Command {
    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(this.getClass()));

        const processName = `${flags.token}-${this.getSuffix()}`;

        abortMissingProcess(processName);
        abortUnknownProcess(processName);
        abortStoppedProcess(processName);

        cli.action.start(`Stopping ${processName}`);

        processManager[flags.daemon ? "delete" : "stop"](processName);

        cli.action.stop();
    }

    public abstract getClass();

    public abstract getSuffix(): string;
}
