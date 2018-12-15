import { app } from "@arkecosystem/core-container";
import { configManager, crypto } from "@arkecosystem/crypto";
import bip38 from "bip38";
import fs from "fs";
import wif from "wif";
import { buildPeerOptions } from "../utils";

export function publish(options) {
    //
}

export function reset(options) {
    //
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
