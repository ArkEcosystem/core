import { configManager, crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import bip38 from "bip38";
import bip39 from "bip39";
import delay from "delay";
import fs from "fs-extra";
import prompts from "prompts";
import wif from "wif";
import Command from "../../command";

export class ConfigureBIP38 extends Command {
    public static description = "Configure the forging delegate (BIP38)";

    public static examples = [`$ ark forger:config:bip38`];

    public static flags = {
        bip38: flags.string({
            char: "b",
            description: "the encrypted bip38",
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

        const response = await prompts([
            {
                type: "password",
                name: "forgerBip39",
                message: "Please enter your delegate passphrase",
                validate: value =>
                    !bip39.validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
            },
            {
                type: "password",
                name: "forgerBip38",
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

    private async performConfiguration(options) {
        const delegatesConfig = `${options.config}/delegates.json`;
        let decodedWIF;

        await this.addTask("Prepare configuration", async () => {
            if (!fs.existsSync(delegatesConfig)) {
                throw new Error(`Couldn't find the core configuration at ${delegatesConfig}.`);
            }

            await delay(500);
        })
            .addTask("Prepare crypto", async () => {
                configManager.setFromPreset(options.network);

                await delay(500);
            })
            .addTask("Loading private key", async () => {
                const keys = crypto.getKeys(options.forgerBip39);
                // @ts-ignore
                decodedWIF = wif.decode(crypto.keysToWIF(keys));

                await delay(500);
            })
            .addTask("Encrypt BIP38", async () => {
                const delegates = require(delegatesConfig);
                delegates.bip38 = bip38.encrypt(decodedWIF.privateKey, decodedWIF.compressed, options.forgerBip38);
                delegates.secrets = [];

                fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));

                await delay(500);
            })
            .runTasks();
    }
}
