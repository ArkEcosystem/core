#!/usr/bin/env node

import { CLI } from "./cli";
import { AppUpdate } from "./commands/app";
import { ConfigPublish, ConfigReset, ConfigureForger } from "./commands/config";
import { CoreProcess, ForgerProcess, RelayProcess } from "./commands/processes";

// tslint:disable-next-line:no-var-requires
const { version } = require("../package.json");

const program = new CLI(version);

program
    // Core
    .add("core:start", "Start a full core instance", CoreProcess, "start")
    .add("core:stop", "Stop a full core instance", CoreProcess, "stop")
    .add("core:restart", "Restart a full core instance", CoreProcess, "restart")
    .add("core:monitor", "Start a full core instance via PM2", CoreProcess, "monitor")
    // Relay
    .add("relay:start", "Start a relay instance", RelayProcess, "start")
    .add("relay:stop", "Stop a relay instance", RelayProcess, "stop")
    .add("relay:restart", "Restart a relay instance", RelayProcess, "restart")
    .add("relay:monitor", "Start a relay instance via PM2", RelayProcess, "monitor")
    // Forger
    .add("forger:start", "Start a forger instance", ForgerProcess, "start")
    .add("forger:stop", "Stop a forger instance", ForgerProcess, "stop")
    .add("forger:restart", "Restart a forger instance", ForgerProcess, "restart")
    .add("forger:monitor", "Start a forger instance via PM2", ForgerProcess, "monitor")
    // Configuration
    .add("config:publish", "Publish the configuration", ConfigPublish)
    .add("config:reset", "Reset the configuration", ConfigReset)
    .add("config:forger", "Configure the delegate that will be used to forge", ConfigureForger)
    // App
    .add("update", "Update the installation", AppUpdate, "update")
    // Launch
    .launch();
