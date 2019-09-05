import { flags } from "@oclif/command";

import { flagsNetwork } from "../../common/flags";
import { AbstractStopCommand } from "../../shared/stop";
import { CommandFlags } from "../../types";

export class StopCommand extends AbstractStopCommand {
    public static description = "Stop the relay";

    public static examples: string[] = [
        `Stop the relay
$ ark relay:stop
`,
        `Stop the relay daemon
$ ark relay:stop --daemon
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
        return "relay";
    }
}
