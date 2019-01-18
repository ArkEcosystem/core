const envPaths = require("env-paths");
const expandHomeDir = require('expand-home-dir');
const fs = require('fs-extra');
const pm2 = require('pm2');

// Delete all pm2 processes created by commander
function deletePM2(name) {
    pm2.connect(connectionError => {
        if (connectionError) {
            console.error(connectionError);
            process.exit(2);
        }

        pm2.delete(processName, deleteError => {
            pm2.disconnect();

            if (deleteError) {
                throw deleteError;
            }
        });
    });
};

deletePM2('ark-core-relay');
deletePM2('ark-core-forger');
deletePM2('core-relay');
deletePM2('core-forger');

// Paths
const corePaths = envPaths("ark", {
    suffix: "core"
});

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
    temp: {
        old: expandHomeDir('~/.ark/temp'),
        new: corePaths.temp,
    },
    data: {
        old: expandHomeDir('~/.ark'),
        new: corePaths.data,
    },
};

// Move files & directories
for (const value of Object.values(paths)) {
    if (fs.existsSync(value.old)) {
        fs.ensureDirSync(value.new);

        fs.moveSync(value.old, value.new, {
            overwrite: true
        });

        fs.removeSync(value.old);
    }
}

// Remove old or temp files
fs.removeSync(`${paths.config.old}/peers_backup.json`);
fs.removeSync(`${paths.config.old}/network.json`);
fs.removeSync(`${paths.config.old}/genesisBlock.json`);

// Ensure that all files core needs exist
const requiredFiles = [
    `${paths.config.new}/.env`,
    `${paths.config.new}/delegates.json`,
    `${paths.config.new}/peers.json`,
    `${paths.config.new}/plugins.json`,
];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`File ${file} does not exist.`);

        // TODO: copy or create file or directory if it doesn't exist
    }
}

// TODO: update configuration files
// TODO: validate configuration files
