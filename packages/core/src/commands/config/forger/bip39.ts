import bip39 from "bip39";
import delay from "delay";
import fs from "fs-extra";
import ora from "ora";
import prompts from "prompts";

async function performConfiguration(bip39opts) {
    const spinner = ora("Configuring forger...").start();

    const delegatesConfig = `${bip39opts.config}/delegates.json`;

    if (!fs.existsSync(delegatesConfig)) {
        return spinner.fail(`Couldn't find the core configuration files at ${delegatesConfig}.`);
    }

    const delegates = require(delegatesConfig);
    delegates.secrets = [bip39opts.forgerBip39];
    delete delegates.bip38;

    fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));

    await delay(750);

    spinner.succeed("Configured forger!");
}

export async function performBIP39Configuration(options) {
    if (!options.interactive) {
        return performConfiguration(options);
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
            type: "confirm",
            name: "confirm",
            message: "Can you confirm?",
            initial: true,
        },
    ]);

    if (response.confirm) {
        return performConfiguration({ ...options, ...response });
    }
}
