const envPaths = require("env-paths");
const expandHomeDir = require('expand-home-dir');
const fs = require('fs-extra');

// TODO: kill & delete all pm2 processes

// Paths
const corePaths = envPaths("ark", { suffix: "core" });

const paths = {
    core: {
        old: expandHomeDir('~/ark-core'),
        new: expandHomeDir('~/core'),
    },
    cache: {
        old: expandHomeDir('~/.ark/database'),
        new: corePaths.cache,
    },
    config: {
        old: expandHomeDir('~/.ark/config'),
        new: corePaths.config,
    },
    log: {
        old: expandHomeDir('~/.ark/logs'),
        new: corePaths.log,
    },
    data: {
        old: expandHomeDir('~/.ark'),
        new: corePaths.data,
    },
}

// Move files & directories
for (const value of Object.values(paths)) {
    fs.moveSync(value.old, value.new)
}

// TODO: update configuration files
// TODO: validate configuration files
