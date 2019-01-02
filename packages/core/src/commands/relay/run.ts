import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import Command from "../command";

export class RelayRun extends Command {
    public static description = "Run the relay (no daemon)";

    public static examples = [
        `Run a mainnet relay
$ ark relay:run --network=mainnet
`,
        `Run a relay with custom data and config paths
$ ark relay:run --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
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
        `Run a relay without any public facing services
$ ark relay:run --preset=relay-minimal
`,
    ];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(RelayRun);

        return this.buildApplication(app, {
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
