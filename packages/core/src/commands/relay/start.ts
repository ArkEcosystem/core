import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { start } from "../../helpers/pm2";
import { AbstractStartCommand } from "../../shared/start";
import { BaseCommand } from "../command";

export class StartCommand extends AbstractStartCommand {
    public static description: string = "Start the relay";

    public static examples: string[] = [
        `Run a relay with a pm2 daemon
$ ark relay:start --network=mainnet
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
        `Run a relay without a daemon
$ ark relay:start --no-daemon
`,
    ];

    public static flags: Record<string, any> = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
        ...BaseCommand.flagsForger,
        daemon: flags.boolean({
            description: "start the process as a daemon",
            default: true,
            allowNo: true,
        }),
    };

    public getClass() {
        return StartCommand;
    }

    protected async runWithDaemon(flags: Record<string, any>): Promise<void> {
        start({
            name: `${flags.token}-relay`,
            script: "./bin/run",
            args: `relay:start --no-daemon ${this.flagsToStrings(flags)}`,
        });
    }

    protected async runWithoutDaemon(flags: Record<string, any>): Promise<void> {
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
