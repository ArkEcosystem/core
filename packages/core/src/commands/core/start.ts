import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { start } from "../../pm2";
import { BaseCommand as Command } from "../command";

export class CoreStart extends Command {
    public static description = "Start the core";

    public static examples = [
        `Run a mainnet relay
$ ark core:start --network=mainnet
`,
        `Run a relay with custom data and config paths
$ ark core:start --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
        `Run a genesis relay
$ ark core:start --networkStart
`,
        `Disable any discovery by other peers
$ ark core:start --disableDiscovery
`,
        `Skip the initial discovery
$ ark core:start --skipDiscovery
`,
        `Ignore the minimum network reach
$ ark core:start --ignoreMinimumNetworkReach
`,
        `Start a seed
$ ark core:start --launchMode=seed
`,
        `Run a relay without any public facing services
$ ark core:start --preset=relay-minimal
`,
    ];

    public static flags = {
        ...Command.flagsNetwork,
        ...Command.flagsBehaviour,
        ...Command.flagsForger,
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
            default: true,
            allowNo: true,
        }),
    };

    public async run() {
        const { flags } = this.parse(CoreStart);

        if (!flags.daemon) {
            return this.runWithoutDaemon(flags);
        }

        start({
            name: "ark-core",
            script: "./dist/index.js",
            args: `core:start ${this.flagsToStrings(flags)}`,
            env: {
                ARK_FORGER_BIP38: flags.bip38,
                ARK_FORGER_PASSWORD: flags.password,
            },
        });
    }

    private async runWithoutDaemon(flags) {
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
