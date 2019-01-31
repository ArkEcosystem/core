import { AbstractStopCommand } from "../shared/stop";

export class StopCommand extends AbstractStopCommand {
    public static description: string = "Stop the core";

    public static examples: string[] = [
        `Stop the core
$ ark core:stop
`,
        `Stop the core daemon
$ ark core:stop --daemon
`,
    ];

    public getClass() {
        return StopCommand;
    }

    public getSuffix(): string {
        return "core";
    }
}
