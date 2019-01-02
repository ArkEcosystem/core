import { configManager, crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import bip38 from "bip38";
import bip39 from "bip39";
import delay from "delay";
import fs from "fs-extra";
import prompts from "prompts";
import wif from "wif";
import { BaseCommand as Command } from "../../command";

export class ConfigureBIP38 extends Command {
    public static description = "Configure the forging delegate (BIP38)";

    public static examples = [
        `Configure a delegate using an encrypted BIP38
$ ark config:forger:bip38 --bip39="..." --password="..."
`,
    ];

    public static flags = {
        network: flags.string({
            description: "the name of the network that should be used",
            options: ["mainnet", "devnet", "testnet"],
            required: true,
        }),
        bip39: flags.string({
            char: "b",
            description: "the plain text bip39 passphrase",
            required: true,
        }),
        password: flags.string({
            char: "p",
            description: "the password for the encrypted bip38",
            required: true,
        }),
    };

    public async run() {
        const { flags } = this.parse(ConfigureBIP38);

        if (flags.bip39 && flags.password) {
            return this.performConfiguration(flags);
        }

        // Interactive CLI
        const response = await prompts([
            {
                type: "password",
                name: "bip39",
                message: "Please enter your delegate passphrase",
                validate: value =>
                    !bip39.validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
            },
            {
                type: "password",
                name: "password",
                message: "Please enter your desired BIP38 password",
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
                initial: true,
            },
        ]);

        if (response.confirm) {
            return this.performConfiguration({ ...flags, ...response });
        }
    }

    private async performConfiguration(flags) {
        const delegatesConfig = `${flags.config}/delegates.json`;
        let decodedWIF;

        await this.addTask("Prepare configuration", async () => {
            if (!fs.existsSync(delegatesConfig)) {
                throw new Error(`Couldn't find the core configuration at ${delegatesConfig}.`);
            }

            await delay(500);
        })
            .addTask("Validate passphrase", async () => {
                if (!bip39.validateMnemonic(flags.bip39)) {
                    throw new Error(`Failed to verify the given passphrase as BIP39 compliant.`);
                }

                await delay(500);
            })
            .addTask("Prepare crypto", async () => {
                configManager.setFromPreset(flags.network);

                await delay(500);
            })
            .addTask("Loading private key", async () => {
                const keys = crypto.getKeys(flags.bip39);
                // @ts-ignore
                decodedWIF = wif.decode(crypto.keysToWIF(keys));

                await delay(500);
            })
            .addTask("Encrypt BIP38", async () => {
                const delegates = require(delegatesConfig);
                delegates.bip38 = bip38.encrypt(decodedWIF.privateKey, decodedWIF.compressed, flags.password);
                delegates.secrets = [];

                fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));

                await delay(500);
            })
            .runTasks();
    }
}
