import { configManager, crypto } from "@arkecosystem/crypto";
import bip38 from "bip38";
import bip39 from "bip39";
import delay from "delay";
import fs from "fs-extra";
import ora from "ora";
import prompts from "prompts";
import wif from "wif";

import { AbstractCommand } from "../../command";

export class ConfigureBIP38 extends AbstractCommand {
    public async configure() {
        if (this.isInterface()) {
            return this.performConfiguration(this.options);
        }

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
            return this.performConfiguration({ ...this.options, ...response });
        }
    }

    private async performConfiguration(options) {
        const spinner = ora("Configuring forger...").start();

        const delegatesConfig = `${options.config}/delegates.json`;

        if (!fs.existsSync(delegatesConfig)) {
            return spinner.fail(`Couldn't find the core configuration files at ${delegatesConfig}.`);
        }

        spinner.text = "Preparing crypto...";
        configManager.setFromPreset(options.network);

        await delay(750);

        spinner.text = "Loading private key...";
        const keys = crypto.getKeys(options.forgerBip39);
        // @ts-ignore
        const decoded = wif.decode(crypto.keysToWIF(keys));

        await delay(750);

        spinner.text = "Encrypting BIP38...";

        const delegates = require(delegatesConfig);
        delegates.bip38 = bip38.encrypt(decoded.privateKey, decoded.compressed, options.forgerBip38);
        delegates.secrets = []; // remove the plain text secrets in favour of bip38

        fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));

        await delay(750);

        spinner.succeed("Configured forger!");
    }
}
