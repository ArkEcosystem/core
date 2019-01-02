import { flags } from "@oclif/command";
import { shutdown, stop } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class StopCommand extends BaseCommand {
    public static description: string = "Stop the forger";

    public static examples: string[] = [
        `Stop the forger
$ ark forger:stop
`,
        `Stop the forger and daemon
$ ark forger:stop --daemon
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

        flags.daemon ? shutdown("ark-core-forger") : stop("ark-core-forger");
    }
}
