import { flags } from "@oclif/command";
import { shutdown, stop } from "../../helpers/pm2";
import { BaseCommand as Command } from "../command";

export class CoreStop extends Command {
    public static description = "Stop the core";

    public static examples = [
        `Stop the core
$ ark core:stop
`,
        `Stop the core and daemon
$ ark core:stop --daemon
`,
    ];

    public static flags = {
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
        }),
    };

    public async run() {
        const { flags } = this.parse(CoreStop);

        flags.daemon ? shutdown("ark-core") : stop("ark-core");
    }
}
