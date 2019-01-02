import { flags } from "@oclif/command";
import { shutdown, stop } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class StopCommand extends BaseCommand {
    public static description: string = "Stop the relay";

    public static examples: string[] = [
        `Stop the relay
$ ark relay:stop
`,
        `Stop the relay and daemon
$ ark relay:stop --daemon
`,
    ];

    public static flags: Record<string, any> = {
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(StopCommand);

        flags.daemon ? shutdown("ark-core-relay") : stop("ark-core-relay");
    }
}
