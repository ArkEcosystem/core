import Command, { flags } from "@oclif/command";
import { validateMnemonic } from "bip39";
import { writeJSONSync } from "fs-extra";
import prompts from "prompts";

import { abort } from "../../../common/cli";
import { getPaths } from "../../../common/env";
import { flagsNetwork } from "../../../common/flags";
import { parseWithNetwork } from "../../../common/parser";
import { TaskService } from "../../../common/task.service";
import { CommandFlags } from "../../../types";

export class BIP39Command extends Command {
    public static description = "Configure the forging delegate (BIP39)";

    public static examples: string[] = [
        `Configure a delegate using a BIP39 passphrase
$ ark config:forger:bip39 --bip39="..."
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        bip39: flags.string({
            description: "the plain text bip39 passphrase",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(BIP39Command));

        if (flags.bip39) {
            return this.performConfiguration(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "password",
                name: "bip39",
                message: "Please enter your delegate passphrase",
                validate: /* istanbul ignore next */ value =>
                    /* istanbul ignore next */ !validateMnemonic(value)
                        ? `Failed to verify the given passphrase as BIP39 compliant.`
                        : true,
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.bip39) {
            abort("Failed to verify the given passphrase as BIP39 compliant.");
        }

        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }

    private async performConfiguration(flags): Promise<void> {
        const { config } = getPaths(flags.token, flags.network);

        const tasks: TaskService = new TaskService();

        tasks.add("Validate passphrase", () => {
            if (!validateMnemonic(flags.bip39)) {
                abort(`Failed to verify the given passphrase as BIP39 compliant.`);
            }
        });

        tasks.add("Write BIP39 to configuration", () => {
            const delegatesConfig = `${config}/delegates.json`;

            const delegates: Record<string, string | string[]> = require(delegatesConfig);
            delegates.secrets = [flags.bip39];
            delete delegates.bip38;

            writeJSONSync(delegatesConfig, delegates);
        });

        await tasks.run();
    }
}
