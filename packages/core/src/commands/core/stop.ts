import { flags } from "@oclif/command";
import { AbstractStopCommand } from "../../shared/stop";
import { BaseCommand } from "../command";

export class StopCommand extends AbstractStopCommand {
    public static description: string = "Stop the core";

    public static examples: string[] = [
        `Stop the core
$ ark core:stop
`,
        `Stop the core daemon
$ ark core:stop --daemon
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        daemon: flags.boolean({
            description: "stop the process or daemon",
        }),
    };

    public getClass() {
        return StopCommand;
    }

    public getSuffix(): string {
        return "core";
    }
}
