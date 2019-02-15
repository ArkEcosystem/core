import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { AbstractStartCommand } from "../../shared/start";
import { BaseCommand } from "../command";

export class StartCommand extends AbstractStartCommand {
    public static description: string = "Start the core";

    public static examples: string[] = [
        `Run core with a daemon
$ ark core:start
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
        `Run core without a daemon
$ ark core:start --no-daemon
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
        try {
            const { bip38, password } = await this.buildBIP38(flags);

            this.runWithPm2(
                {
                    name: `${flags.token}-core`,
                    // @ts-ignore
                    script: this.config.options.root,
                    args: `core:start --no-daemon ${this.flagsToStrings(flags)}`,
                    env: {
                        CORE_FORGER_BIP38: bip38,
                        CORE_FORGER_PASSWORD: password,
                    },
                },
                flags.daemon,
            );
        } catch (error) {
            this.error(error.message);
        }
    }

    protected async runWithoutDaemon(flags: Record<string, any>): Promise<void> {
        await this.buildApplication(app, flags, {
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(flags),
                "@arkecosystem/core-blockchain": {
                    networkStart: flags.networkStart,
                },
                "@arkecosystem/core-forger": await this.buildBIP38(flags),
            },
        });
    }
}
