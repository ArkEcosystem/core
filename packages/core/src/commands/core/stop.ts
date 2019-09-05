import { flags } from "@oclif/command";

import { flagsNetwork } from "../../common/flags";
import { AbstractStopCommand } from "../../shared/stop";
import { CommandFlags } from "../../types";

export class StopCommand extends AbstractStopCommand {
    public static description = "Stop the core";

    public static examples: string[] = [
        `Stop the core
$ ark core:stop
`,
        `Stop the core daemon
$ ark core:stop --daemon
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
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
