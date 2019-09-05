import { Crypto, Identities, Managers } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import { validateMnemonic } from "bip39";
import { writeJSONSync } from "fs-extra";
import prompts from "prompts";
import wif from "wif";

import { abort } from "../../../common/cli";
import { getPaths } from "../../../common/env";
import { flagsNetwork } from "../../../common/flags";
import { parseWithNetwork } from "../../../common/parser";
import { TaskService } from "../../../common/task.service";
import { CommandFlags } from "../../../types";

export class BIP38Command extends Command {
    public static description = "Configure the forging delegate (BIP38)";

    public static examples: string[] = [
        `Configure a delegate using an encrypted BIP38
$ ark config:forger:bip38 --bip39="..." --password="..."
`,
    ];

    public static flags: CommandFlags = {
        ...flagsNetwork,
        bip39: flags.string({
            description: "the plain text bip39 passphrase",
        }),
        password: flags.string({
            description: "the password for the encrypted bip38",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await parseWithNetwork(this.parse(BIP38Command));

        if (flags.bip39 && flags.password) {
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
                        ? "Failed to verify the given passphrase as BIP39 compliant."
                        : true,
            },
            {
                type: "password",
                name: "password",
                message: "Please enter your desired BIP38 password",
                validate: /* istanbul ignore next */ value =>
                    typeof value !== "string" ? "The BIP38 password has to be a string." : true,
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

        if (!response.password) {
            abort("The BIP38 password has to be a string.");
        }

        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }

    private async performConfiguration(flags): Promise<void> {
        const { config } = getPaths(flags.token, flags.network);

        let decodedWIF;

        const tasks: TaskService = new TaskService();

        tasks.add("Validate passphrase", () => {
            if (!validateMnemonic(flags.bip39)) {
                abort(`Failed to verify the given passphrase as BIP39 compliant.`);
            }
        });

        tasks.add("Prepare crypto", () => {
            Managers.configManager.setFromPreset(flags.network);
        });

        tasks.add("Loading private key", () => {
            // @ts-ignore
            decodedWIF = wif.decode(Identities.WIF.fromPassphrase(flags.bip39));
        });

        tasks.add("Encrypt BIP38", () => {
            const delegatesConfig = `${config}/delegates.json`;

            const delegates = require(delegatesConfig);
            delegates.bip38 = Crypto.bip38.encrypt(decodedWIF.privateKey, decodedWIF.compressed, flags.password);
            delegates.secrets = [];

            writeJSONSync(delegatesConfig, delegates);
        });

        await tasks.run();
    }
}
