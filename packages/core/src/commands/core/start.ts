import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { start } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class StartCommand extends BaseCommand {
    public static description: string = "Start the core";

    public static examples: string[] = [
        `Run core on mainnet
$ ark core:start --network=mainnet
`,
        `Run core with custom data and config paths
$ ark core:start --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
        `Run core as genesis
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
        `Run core without any public facing services
$ ark core:start --preset=relay-minimal
`,
        `Run core without a daemon
$ ark core:start --no-daemon
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
        ...BaseCommand.flagsForger,
        daemon: flags.boolean({
            char: "d",
            description: "stop the process and daemon",
            default: true,
            allowNo: true,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(StartCommand);

        if (!flags.daemon) {
            return this.runWithoutDaemon(flags);
        }

        start({
            name: "ark-core",
            script: "./dist/index.js",
            args: `core:start ${this.flagsToStrings(flags)}`,
            env: {
                CORE_FORGER_BIP38: flags.bip38,
                CORE_FORGER_PASSWORD: flags.password,
            },
        });
    }

    private async runWithoutDaemon(flags: Record<string, any>) {
        return this.buildApplication(app, {
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
                "@arkecosystem/core-forger": {
                    bip38: flags.bip38 || process.env.CORE_FORGER_BIP38,
                    password: flags.password || process.env.CORE_FORGER_BIP39,
                },
            },
        });
    }
}
