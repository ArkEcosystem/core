#!/usr/bin/env node

import { configManager, crypto } from "@arkecosystem/crypto";
import bip38 from "bip38";
import cli from "commander";
import fs from "fs";
import wif from "wif";
import { app, config, processes } from "./commands";

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

function commandWithForger(name: string, description: string): any {
    return command(name, description)
        .option("-b, --bip38 <bip38>", "forger bip38")
        .option("-p, --password <password>", "forger password");
}

// Core
commandWithForger("core:start", "Start a full core instance").action(processes.core.start);
command("core:stop", "Stop a full core instance").action(processes.core.stop);
command("core:restart", "Restart a full core instance").action(processes.core.restart);
commandWithForger("core:monitor", "Start a full core instance via PM2").action(processes.core.monitor);

// Relay
command("relay:start", "Start a relay instance").action(processes.relay.start);
command("relay:stop", "Stop a relay instance").action(processes.relay.stop);
command("relay:restart", "Restart a relay instance").action(processes.relay.restart);
command("relay:monitor", "Start a relay instance via PM2").action(processes.relay.monitor);

// Forger
commandWithForger("forger:start", "Start a forger instance").action(processes.forger.start);
command("forger:stop", "Stop a forger instance").action(processes.forger.stop);
command("forger:restart", "Restart a forger instance").action(processes.forger.restart);
commandWithForger("forger:monitor", "Start a forger instance via PM2").action(processes.forger.monitor);

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
