import { app } from "@arkecosystem/core-container";
import { AbstractRunCommand } from "../../shared/run";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RunCommand extends AbstractRunCommand {
    public static description: string = "Run the core (without pm2)";

    public static examples: string[] = [
        `Run core
$ ark core:run
`,
        `Run core as genesis
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
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsBehaviour,
        ...BaseCommand.flagsForger,
    };

    public async run(): Promise<void> {
        const flags = await super.getFlags();

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

    protected getClass() {
        return RunCommand;
    }

    protected getSuffix(): string {
        return "forger";
    }
}
