import { AbstractRestartCommand } from "../../shared/restart";
import { BaseCommand } from "../command";

export class RestartCommand extends AbstractRestartCommand {
    public static description: string = "Restart the relay";

    public static examples: string[] = [
        `Restart the relay
$ ark relay:restart
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
    };

    public getClass() {
        return RestartCommand;
    }

    public getSuffix(): string {
        return "relay";
    }
}
