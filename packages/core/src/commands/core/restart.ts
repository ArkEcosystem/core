import { AbstractRestartCommand } from "../shared/restart";

export class RestartCommand extends AbstractRestartCommand {
    public static description: string = "Restart the core";

    public static examples: string[] = [
        `Restart the core
$ ark core:restart
`,
    ];

    public getClass() {
        return RestartCommand;
    }

    public getSuffix(): string {
        return "core-forger";
    }
}
