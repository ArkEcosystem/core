#!/usr/bin/env node

import { configManager, crypto } from "@arkecosystem/crypto";
import bip38 from "bip38";
import cli from "commander";
import fs from "fs";
import wif from "wif";
import { app, config, start } from "./commands";

// tslint:disable-next-line:no-var-requires
const { version } = require("../package.json");

cli.version(version);

function command(name: string, description: string): any {
    return cli
        .command(name)
        .description(description)
        .option("-d, --data <data>", "data directory", "~/.ark")
        .option("-c, --config <config>", "core config", "~/.ark/config")
        .option("-t, --token <token>", "token name", "ark")
        .option("-n, --network <network>", "token network")
        .option("-r, --remote <remote>", "remote peer for config")
        .option("--network-start", "force genesis network start", false)
        .option("--disable-discovery", "disable any peer discovery")
        .option("--skip-discovery", "skip the initial peer discovery")
        .option("--ignore-minimum-network-reach", "skip the network reach check")
        .option("--launch-mode <mode>", "the application configuration mode")
        .option("--i, --interactive", "provide an interactive UI", false);
}

// Start Processes
command("start", "start a relay node and the forger")
    .option("-b, --bip38 <bip38>", "forger bip38")
    .option("-p, --password <password>", "forger password")
    .action(start.relayAndForger);

command("relay", "start a relay node").action(start.relay);

command("forger", "start the forger")
    .option("-b, --bip38 <bip38>", "forger bip38")
    .option("-p, --password <password>", "forger password")
    .action(start.forger);

// Forger
command("forger:secret", "set the delegate secret")
    .option("-s, --secret <secret>", "forger secret")
    .action(config.forgerSecret);

command("forger:bip38", "encrypt the delegate passphrase using bip38")
    .option("-s, --secret <secret>", "forger secret")
    .option("-p, --password <password>", "bip38 password")
    .action(config.forgerBIP38);

// Configuration
command("config:publish", "TBD").action(config.publish);

command("config:reset", "TBD").action(config.reset);

// App
command("update", "TBD").action(app.update);

cli.command("*").action(env => {
    cli.help();
    process.exit(0);
});

cli.parse(process.argv);
