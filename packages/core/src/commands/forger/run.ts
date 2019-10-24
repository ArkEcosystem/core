import { app } from "@arkecosystem/core-kernel";
import Command, { flags } from "@oclif/command";

import { getConfigValue } from "../../common/config";
import { buildBIP38 } from "../../common/crypto";
import { flagsForger, flagsNetwork } from "../../common/flags";
import { parseWithNetwork } from "../../common/parser";
import { CommandFlags } from "../../types";

export class RunCommand extends Command {
    public static description = "Run the forger (without pm2)";

    public static examples: string[] = [
        `Run a forger with a bip39 passphrase
$ ark forger:run --bip39="..."
`,
        `Run a forger with an encrypted bip38
$ ark forger:run --bip38="..." --password="..."
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        ...flagsForger,
        env: flags.string({
            default: "production",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(RunCommand));

        // @ts-ignore
        await app.bootstrap({
            ...getConfigValue(flags, "app", "cli.forger.run"),
            ...{
                flags,
                plugins: {
                    include: ["@arkecosystem/core-forger"],
                    // todo: this can actually be removed and done inside the service provider of the packages
                    options: {
                        "@arkecosystem/core-forger": await buildBIP38(flags),
                    },
                },
            },
        });

        await app.boot();
    }
}
