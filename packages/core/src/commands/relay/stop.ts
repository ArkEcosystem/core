import { AbstractStopCommand } from "../shared/stop";

export class StopCommand extends AbstractStopCommand {
    public static description: string = "Stop the relay";

    public static examples: string[] = [
        `Stop the relay
$ ark relay:stop
`,
        `Stop the relay daemon
$ ark relay:stop --daemon
`,
    ];

    public getClass() {
        return StopCommand;
    }

    public getSuffix(): string {
        return "core-relay";
    }
}
