import { AbstractRestartCommand } from "../../shared/restart";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RestartCommand extends AbstractRestartCommand {
    public static description: string = "Restart the forger";

    public static examples: string[] = [
        `Restart the forger
$ ark forger:restart
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
    };

    public getClass() {
        return RestartCommand;
    }

    public getSuffix(): string {
        return "forger";
    }
}
