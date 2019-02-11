import { AbstractRestartCommand } from "../../shared/restart";

export class RestartCommand extends AbstractRestartCommand {
    public static description: string = "Restart the forger";

    public static examples: string[] = [
        `Restart the forger
$ ark forger:restart
`,
    ];

    public getClass() {
        return RestartCommand;
    }

    public getSuffix(): string {
        return "core-forger";
    }
}
