import { AbstractStopCommand } from "../../shared/stop";

export class StopCommand extends AbstractStopCommand {
    public static description: string = "Stop the forger";

    public static examples: string[] = [
        `Stop the forger
$ ark forger:stop
`,
        `Stop the forger daemon
$ ark forger:stop --daemon
`,
    ];

    public getClass() {
        return StopCommand;
    }

    public getSuffix(): string {
        return "forger";
    }
}
