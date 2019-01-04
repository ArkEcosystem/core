#!/usr/bin/env node

import { bip38, configManager, crypto } from "@arkecosystem/crypto";
import app from "commander";
import fs from "fs";
import wif from "wif";
import { startForger, startRelay, startRelayAndForger } from "./commands";

// tslint:disable-next-line:no-var-requires
const { version } = require("../package.json");

app.version(version);

function registerCommand(name: string, description: string): any {
    return app
        .command(name)
        .description(description)
        .option("-d, --data <data>", "data directory", "~/.ark")
        .option("-c, --config <config>", "core config", "~/.ark/config")
        .option("-n, --network <network>", "token network")
        .option("-r, --remote <remote>", "remote peer for config")
        .option("--network-start", "force genesis network start", false)
        .option("--disable-discovery", "disable any peer discovery")
        .option("--skip-discovery", "skip the initial peer discovery")
        .option("--ignore-minimum-network-reach", "skip the network reach check")
        .option("--launch-mode <mode>", "remote peer for config");
}

registerCommand("start", "start a relay node and the forger")
    .option("-b, --bip38 <bip38>", "forger bip38")
    .option("-p, --password <password>", "forger password")
    .action(async options => startRelayAndForger(options, version));

registerCommand("relay", "start a relay node").action(async options => startRelay(options, version));

registerCommand("forger", "start the forger")
    .option("-b, --bip38 <bip38>", "forger bip38")
    .option("-p, --password <password>", "forger password")
    .action(async options => startForger(options, version));

registerCommand("forger-plain", "set the delegate secret")
    .option("-s, --secret <secret>", "forger secret")
    .action(async options => {
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
    });

registerCommand("forger-bip38", "encrypt the delegate passphrase using bip38")
    .option("-s, --secret <secret>", "forger secret")
    .option("-p, --password <password>", "bip38 password")
    .action(async options => {
        const delegatesConfig = `${options.config}/delegates.json`;
        if (!options.config || !fs.existsSync(delegatesConfig)) {
            // tslint:disable-next-line:no-console
            console.error("Missing or invalid delegates config path");
            process.exit(1);
        }

        configManager.setFromPreset(options.network);

        const keys = crypto.getKeys(options.secret);
        // @ts-ignore
        const decoded = wif.decode(crypto.keysToWIF(keys));

        const delegates = require(delegatesConfig);
        delegates.bip38 = bip38.encrypt(decoded.privateKey, decoded.compressed, options.password);
        delegates.secrets = []; // remove the plain text secrets in favour of bip38

        fs.writeFileSync(delegatesConfig, JSON.stringify(delegates, null, 2));
    });

app.command("*").action(env => {
    app.help();
    process.exit(0);
});

app.parse(process.argv);
