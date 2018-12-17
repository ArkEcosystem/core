import { app } from "@arkecosystem/core-container";
import { configManager, crypto } from "@arkecosystem/crypto";
import bip38 from "bip38";
import bip39 from "bip39";
import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs-extra";
import ora from "ora";
import { resolve } from "path";
import prompts from "prompts";
import wif from "wif";
import { buildPeerOptions } from "../utils";

export async function publish(options) {
    const response = await prompts([
        {
            type: "autocomplete",
            name: "network",
            message: "What network do you want to operate on?",
            choices: [
                { title: "Production", value: "mainnet" },
                { title: "Development", value: "devnet" },
                { title: "Test", value: "testnet" },
            ],
        },
        {
            type: "text",
            name: "config",
            message: "Where do you want the configuration to be located?",
            initial: options.config,
            validate: value => fs.existsSync(value),
        },
        {
            type: "confirm",
            name: "confirm",
            message: "Can you confirm?",
            initial: true,
        },
    ]);

    if (response.confirm) {
        const spinner = ora("Searching configuration...").start();

        // create .env file

        const coreConfigDest = resolve(expandHomeDir(response.config));
        const coreConfigSrc = resolve(__dirname, `../../src/config/${response.network}`);
        // TODO: adjust this once feat/milestones is merged
        const cryptoConfigSrc = resolve(__dirname, `../../../crypto/src/networks/ark/${response.network}.json`);

        if (!fs.existsSync(coreConfigSrc)) {
            spinner.fail(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
        }

        if (!fs.existsSync(cryptoConfigSrc)) {
            spinner.fail(`Couldn't find the crypto configuration files at ${cryptoConfigSrc}.`);
        }

        fs.ensureDirSync(coreConfigDest);

        await delay(750);

        spinner.text = "Publishing core configuration...";
        fs.copySync(coreConfigSrc, coreConfigDest);

        await delay(750);

        spinner.text = "Publishing crypto configuration...";
        // TODO: adjust this once feat/milestones is merged
        fs.copySync(cryptoConfigSrc, `${coreConfigDest}/network.json`);

        await delay(750);

        spinner.succeed("Published configuration!");
    }
}

export async function reset(options) {
    const response = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message: "Are you absolutely sure that you want to reset the configuration?",
            initial: true,
        },
    ]);

    if (response.confirm) {
        const spinner = ora("Removing configuration...").start();

        fs.removeSync(resolve(expandHomeDir(options.config)));

        await delay(750);

        spinner.succeed("Removed configuration!");

        await publish(options);
    }
}

export async function forgerPlain(options) {
    const response = await prompts([
        {
            type: "password",
            name: "secret",
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
        const spinner = ora("Configuring forger...").start();

        const delegatesConfig = `${options.config}/delegates.json`;

        if (!fs.existsSync(delegatesConfig)) {
            return spinner.fail(`Couldn't find the core configuration files at ${delegatesConfig}.`);
        }

        const delegates = require(delegatesConfig);
        delegates.secrets = [options.secret];
        delete delegates.bip38;

        fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));

        await delay(750);

        spinner.succeed("Configured forger!");
    }
}

export async function forgerBIP38(options) {
    const response = await prompts([
        {
            type: "password",
            name: "passphrase",
            message: "Please enter your delegate passphrase",
            validate: value =>
                !bip39.validateMnemonic(value) ? `Failed to verify the given passphrase as BIP39 compliant.` : true,
        },
        {
            type: "password",
            name: "bip38password",
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
        const spinner = ora("Configuring forger...").start();

        const delegatesConfig = `${options.config}/delegates.json`;

        if (!fs.existsSync(delegatesConfig)) {
            return spinner.fail(`Couldn't find the core configuration files at ${delegatesConfig}.`);
        }

        spinner.text = "Preparing crypto...";
        configManager.setFromPreset(options.token, options.network);

        await delay(750);

        spinner.text = "Loading private key...";
        const keys = crypto.getKeys(response.passphrase);
        // @ts-ignore
        const decoded = wif.decode(crypto.keysToWIF(keys));

        await delay(750);

        spinner.text = "Encrypting BIP38...";

        const delegates = require(delegatesConfig);
        delegates.bip38 = bip38.encrypt(decoded.privateKey, decoded.compressed, response.bip38password);
        delegates.secrets = []; // remove the plain text secrets in favour of bip38

        fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));

        await delay(750);

        spinner.succeed("Configured forger!");
    }
}
