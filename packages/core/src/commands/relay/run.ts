import { app } from "@arkecosystem/core-container";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RunCommand extends BaseCommand {
    public static description: string = "Run the relay (without pm2)";

    public static examples: string[] = [
        `Run a relay
$ ark relay:run
`,
        `Run a genesis relay
$ ark relay:run --networkStart
`,
        `Disable any discovery by other peers
$ ark relay:run --disableDiscovery
`,
        `Skip the initial discovery
$ ark relay:run --skipDiscovery
`,
        `Ignore the minimum network reach
$ ark relay:run --ignoreMinimumNetworkReach
`,
        `Start a seed
$ ark relay:run --launchMode=seed
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(RunCommand);

        await this.buildApplication(app, flags, {
            exclude: ["@arkecosystem/core-forger"],
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
            },
        });
    }
}
