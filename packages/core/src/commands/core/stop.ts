import { flags } from "@oclif/command";
import { shutdown, stop } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class CoreStop extends BaseCommand {
    public static description: string = "Stop the core";

    public static examples: string[] = [
        `Stop the core
$ ark core:stop
`,
        `Stop the core and daemon
$ ark core:stop --daemon
`,
    ];

    public static flags: Record<string, any> = {
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(CoreStop);

        flags.daemon ? shutdown("ark-core") : stop("ark-core");
    }
}
