import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { BaseCommand as Command } from "../command";

export class CoreRun extends Command {
    public static description = "Run the core (no daemon)";

    public static examples = [
        `Run a mainnet relay
$ ark core:run --network=mainnet
`,
        `Run a relay with custom data and config paths
$ ark core:run --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
        `Run a genesis relay
$ ark core:run --networkStart
`,
        `Disable any discovery by other peers
$ ark core:run --disableDiscovery
`,
        `Skip the initial discovery
$ ark core:run --skipDiscovery
`,
        `Ignore the minimum network reach
$ ark core:run --ignoreMinimumNetworkReach
`,
        `Start a seed
$ ark core:run --launchMode=seed
`,
        `Run a relay without any public facing services
$ ark core:run --preset=relay-minimal
`,
    ];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
    };

    public async run() {
        const { flags } = this.parse(CoreRun);

        return this.buildApplication(app, {
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
                "@arkecosystem/core-forger": {
                    bip38: flags.bip38 || process.env.ARK_FORGER_BIP38,
                    password: flags.password || process.env.ARK_FORGER_BIP39,
                },
            },
        });
    }
}
