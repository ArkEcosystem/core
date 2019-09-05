import { flagsNetwork } from "../../common/flags";
import { AbstractRestartCommand } from "../../shared/restart";
import { CommandFlags } from "../../types";

export class RestartCommand extends AbstractRestartCommand {
    public static description = "Restart the forger";

    public static examples: string[] = [
        `Restart the forger
$ ark forger:restart
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
    };

    public getClass() {
        return RestartCommand;
    }

    public getSuffix(): string {
        return "forger";
    }
}
