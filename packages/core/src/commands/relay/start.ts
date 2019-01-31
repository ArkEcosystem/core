import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { start } from "../../helpers/pm2";
import { BaseCommand } from "../command";

export class StartCommand extends BaseCommand {
    public static description: string = "Start the relay";

    public static examples: string[] = [
        `Run a mainnet relay
$ ark relay:start --network=mainnet
`,
        `Run a relay with custom data and config paths
$ ark relay:start --data ~/.my-ark --config ~/.my-ark/conf --network=devnet
`,
        `Run a genesis relay
$ ark relay:start --networkStart
`,
        `Disable any discovery by other peers
$ ark relay:start --disableDiscovery
`,
        `Skip the initial discovery
$ ark relay:start --skipDiscovery
`,
        `Ignore the minimum network reach
$ ark relay:start --ignoreMinimumNetworkReach
`,
        `Start a seed
$ ark relay:start --launchMode=seed
`,
        `Run a relay without any public facing services
$ ark relay:start --preset=relay-minimal
`,
        `Run a relay without a daemon
$ ark relay:start --no-daemon
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
        ...BaseCommand.flagsForger,
        daemon: flags.boolean({
            char: "d",
            description: "start the process as a daemon",
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
            name: "ark-core-relay",
            script: "./dist/index.js",
            args: `relay:start --daemon ${this.flagsToStrings(flags)}`,
        });
    }

    private async runWithoutDaemon(flags: Record<string, any>) {
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
