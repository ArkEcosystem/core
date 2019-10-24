import { app } from "@arkecosystem/core-kernel";
import Command, { flags } from "@oclif/command";

import { buildPeerOptions } from "../../common/builder";
import { getConfigValue } from "../../common/config";
import { buildBIP38 } from "../../common/crypto";
import { flagsBehaviour, flagsForger, flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { CommandFlags } from "../../types";

export class RunCommand extends Command {
    public static description = "Run the core (without pm2)";

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
        ...flagsNetwork,
        ...flagsBehaviour,
        ...flagsForger,
        suffix: flags.string({
            hidden: true,
            default: "core",
        }),
        env: flags.string({
            default: "production",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(RunCommand));

        // @ts-ignore
        await app.bootstrap({
            ...getConfigValue(flags, "app", "cli.core.run"),
            ...{
                flags,
                plugins: {
                    // todo: this can actually be removed and done inside the service provider of the packages
                    options: {
                        "@arkecosystem/core-p2p": buildPeerOptions(flags),
                        "@arkecosystem/core-blockchain": {
                            networkStart: flags.networkStart,
                        },
                        "@arkecosystem/core-forger": await buildBIP38(flags),
                    },
                },
            },
        });

        await app.boot();
    }
}
