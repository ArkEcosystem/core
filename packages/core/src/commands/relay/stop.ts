import { flags } from "@oclif/command";
import { shutdown, stop } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class RelayStop extends Command {
    public static description = "Stop the relay";

    public static examples = [
        `Stop the relay
$ ark relay:stop
`,
        `Stop the relay and daemon
$ ark relay:stop --daemon
`,
    ];

    public static flags = {
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
        }),
    };

    public async run() {
        const { flags } = this.parse(RelayStop);

        flags.daemon ? shutdown("ark-core-relay") : stop("ark-core-relay");
    }
}
