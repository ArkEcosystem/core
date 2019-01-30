#!/usr/bin/env node

import { app } from "@arkecosystem/core-kernel";
import cli from "commander";
import { createSnapshot, importSnapshot, rollbackSnapshot, truncateSnapshot, verifySnapshot } from "./commands";
import * as utils from "./utils";

// tslint:disable-next-line:no-var-requires
const { version } = require("../package.json");

cli.version(version);

const registerCommand = (name, description) => {
    return cli
        .command(name)
        .description(description)
        .option("-d, --data <data>", "data directory")
        .option("-c, --config <config>", "network config")
        .option("-t, --token <token>", "token name", "ark")
        .option("-n, --network <network>", "token network")
        .option("--skip-compression", "skip gzip compression", false)
        .option("--trace", "dumps generated queries and settings to console", false);
};

registerCommand("create", "create a full snapshot of the database")
    .option("-b, --blocks <folder>", "blocks to append to, correlates to folder name")
    .option("-s, --start <number>", "start network height to export", -1)
    .option("-e, --end <number>", "end network height to export", -1)
    .option("--codec <string>", "codec name, default is msg-lite binary")
    .action(async options => {
        await utils.setUpLite(options);
        await createSnapshot(options);
    });

registerCommand("import", "import data from specified snapshot")
    .option("-b, --blocks <folder>", "blocks to import, corelates to folder name")
    .option("--codec <string>", "codec name, default is msg-lite binary")
    .option("--truncate", "empty all tables before running import", false)
    .option("--skip-restart-round", "skip revert to current round", false)
    .option("--signature-verify", "signature verification", false)
    .action(async options => {
        await utils.setUpLite(options);
        await importSnapshot(options);
    });

registerCommand("verify", "check validity of specified snapshot")
    .option("-b, --blocks <folder>", "blocks to verify, corelates to folder name")
    .option("--codec <string>", "codec name, default is msg-lite binary")
    .option("--signature-verify", "signature verification", false)
    .action(async options => {
        await utils.setUpLite(options);
        await verifySnapshot(options);
    });

registerCommand("rollback", "rollback chain to specified height")
    .option("-b, --block-height <number>", "block network height number to rollback", -1)
    .action(async options => {
        await utils.setUpLite(options);
        rollbackSnapshot(options);
    });

registerCommand("truncate", "truncate blockchain database").action(async options => {
    await utils.setUpLite(options);
    truncateSnapshot(options);
});

cli.command("*").action(env => {
    cli.help();
    process.exit(0);
});

app.silentShutdown = true;
cli.parse(process.argv);
