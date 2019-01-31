import { AbstractRestartCommand } from "../shared/restart";

export class RestartCommand extends AbstractRestartCommand {
    public static description: string = "Restart the relay";

    public static examples: string[] = [
        `Restart the relay
$ ark relay:restart
`,
    ];

    public getClass() {
        return RestartCommand;
    }

    public getSuffix(): string {
        return "core-relay";
    }
}
