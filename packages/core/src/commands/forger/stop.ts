import { flags } from "@oclif/command";
import { shutdown, stop } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class ForgerStop extends Command {
    public static description = "Stop the forger";

    public static examples = [
        `Stop the forger
$ ark forger:stop
`,
        `Stop the forger and daemon
$ ark forger:stop --daemon
`,
    ];

    public static flags = {
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
        }),
    };

    public async run() {
        const { flags } = this.parse(ForgerStop);

        flags.daemon ? shutdown("ark-core-forger") : stop("ark-core-forger");
    }
}
