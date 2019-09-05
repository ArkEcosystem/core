import { flags } from "@oclif/command";

import { flagsNetwork } from "../../common/flags";
import { AbstractStopCommand } from "../../shared/stop";
import { CommandFlags } from "../../types";

export class StopCommand extends AbstractStopCommand {
    public static description = "Stop the forger";

    public static examples: string[] = [
        `Stop the forger
$ ark forger:stop
`,
        `Stop the forger daemon
$ ark forger:stop --daemon
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
        return "forger";
    }
}
