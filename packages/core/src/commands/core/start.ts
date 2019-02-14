import { app } from "@arkecosystem/core-container";
import { flags } from "@oclif/command";
import { start } from "../../helpers/pm2";
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
        start({
            name: `${flags.token}-core`,
            // @ts-ignore
            script: this.config.options.root,
            args: `core:start --no-daemon ${this.flagsToStrings(flags)}`,
            env: {
                CORE_FORGER_BIP38: flags.bip38,
                CORE_FORGER_PASSWORD: flags.password,
            },
        });
    }

    protected async runWithoutDaemon(flags: Record<string, any>): Promise<void> {
        await this.buildApplication(app, flags, {
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
