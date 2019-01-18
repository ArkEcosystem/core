const envPaths = require("env-paths");
const expandHomeDir = require('expand-home-dir');

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
    data: {
        old: expandHomeDir('~/.ark'),
        new: corePaths.data,
    },
    log: {
        old: expandHomeDir('~/.ark/logs'),
        new: corePaths.log,
    },
    temp: {
        old: expandHomeDir('~/.ark/temp'),
        new: corePaths.temp,
    },
}

// TODO: move config directory
// TODO: move .env file directory
// TODO: move database directory
// TODO: move logs directory
// TODO: update configuration files
// TODO: validate configuration files
