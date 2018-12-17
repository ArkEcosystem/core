import { app } from "@arkecosystem/core-container";
import { configManager, crypto } from "@arkecosystem/crypto";
import bip38 from "bip38";
import delay from "delay";
import expandHomeDir from "expand-home-dir";
import fs from "fs";
import { copySync, ensureDirSync, ensureFileSync, existsSync, removeSync } from "fs-extra";
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

        if (!existsSync(coreConfigSrc)) {
            spinner.fail(`Couldn't find the core configuration files at ${coreConfigSrc}.`);
        }

        if (!existsSync(cryptoConfigSrc)) {
            spinner.fail(`Couldn't find the core configuration files at ${cryptoConfigSrc}.`);
        }

        ensureDirSync(coreConfigDest);

        await delay(750);

        spinner.text = "Publishing core configuration...";
        copySync(coreConfigSrc, coreConfigDest);

        await delay(750);

        spinner.text = "Publishing crypto configuration...";
        // TODO: adjust this once feat/milestones is merged
        copySync(cryptoConfigSrc, `${coreConfigDest}/network.json`);

        await delay(750);

        spinner.succeed("Published configuration!");
    }
}

export async function reset(options) {
    removeSync(resolve(expandHomeDir(options.config)));

    await publish(options);
}

export function forgerSecret(options) {
    const delegatesConfig = `${options.config}/delegates.json`;

    if (!options.config || !fs.existsSync(delegatesConfig)) {
        // tslint:disable-next-line:no-console
        console.error("Missing or invalid delegates config path");
        process.exit(1);
    }

    const delegates = require(delegatesConfig);
    delegates.secrets = [options.secret];
    delete delegates.bip38;

    fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));
}

export function forgerBIP38(options) {
    const delegatesConfig = `${options.config}/delegates.json`;

    if (!options.config || !fs.existsSync(delegatesConfig)) {
        // tslint:disable-next-line:no-console
        console.error("Missing or invalid delegates config path");
        process.exit(1);
    }

    configManager.setFromPreset(options.token, options.network);

    const keys = crypto.getKeys(options.secret);
    // @ts-ignore
    const decoded = wif.decode(crypto.keysToWIF(keys));

    const delegates = require(delegatesConfig);
    delegates.bip38 = bip38.encrypt(decoded.privateKey, decoded.compressed, options.password);
    delegates.secrets = []; // remove the plain text secrets in favour of bip38

    fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));
}
