#!/usr/bin/env node

import { CLI } from "./cli";
import { app, config, processes } from "./commands";

// tslint:disable-next-line:no-var-requires
const { version } = require("../package.json");

const program = new CLI(version);

program
    // Core
    .add("core:start", "Start a full core instance", processes.core.start)
    .add("core:stop", "Stop a full core instance", processes.core.stop)
    .add("core:restart", "Restart a full core instance", processes.core.restart)
    .add("core:monitor", "Start a full core instance via PM2", processes.core.monitor)
    // Relay
    .add("relay:start", "Start a relay instance", processes.relay.start)
    .add("relay:stop", "Stop a relay instance", processes.relay.stop)
    .add("relay:restart", "Restart a relay instance", processes.relay.restart)
    .add("relay:monitor", "Start a relay instance via PM2", processes.relay.monitor)
    // Forger
    .add("forger:start", "Start a forger instance", processes.forger.start)
    .add("forger:stop", "Stop a forger instance", processes.forger.stop)
    .add("forger:restart", "Restart a forger instance", processes.forger.restart)
    .add("forger:monitor", "Start a forger instance via PM2", processes.forger.monitor)
    // Configuration
    .add("config:publish", "Publish the configuration", config.publish)
    .add("config:reset", "Reset the configuration", config.reset)
    .add("config:forger", "Configure the delegate that will be used to forge", config.forger)
    // App
    .add("update", "Update the installation", app.update)
    // Launch
    .launch();
