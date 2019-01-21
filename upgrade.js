const envPaths = require('env-paths');
const expandHomeDir = require('expand-home-dir');
const fs = require('fs-extra');
const Joi = require('joi');
const pm2 = require('pm2');
const prompts = require('prompts');

// Delete all pm2 processes created by commander
function deletePM2(processName) {
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

const main = async () => {
    const {
        corePath,
        coreData
    } = await prompts([{
        type: 'text',
        name: 'corePath',
        initial: expandHomeDir('~/ark-core'),
        message: 'Where is the installation located at?',
        validate: value => fs.existsSync(value) ? true : `${value} does not exist.`
    }, {
        type: 'text',
        name: 'coreData',
        initial: expandHomeDir('~/.ark'),
        message: 'Where is the configuration located at?',
        validate: value => fs.existsSync(value) ? true : `${value} does not exist.`
    }]);

    deletePM2('ark-core-relay');
    deletePM2('ark-core-forger');
    deletePM2('core-relay');
    deletePM2('core-forger');

    // Paths
    const corePaths = envPaths('ark', {
        suffix: 'core'
    });

    const paths = {
        core: {
            old: expandHomeDir(corePath),
            new: expandHomeDir('~/core'),
        },
        cache: {
            old: expandHomeDir(`${coreData}/database`),
            new: expandHomeDir(corePaths.cache),
        },
        config: {
            old: expandHomeDir(`${coreData}/config`),
            new: expandHomeDir(corePaths.config),
        },
        log: {
            old: expandHomeDir(`${coreData}/logs`),
            new: expandHomeDir(corePaths.log),
        },
        temp: {
            old: expandHomeDir(`${coreData}/temp`),
            new: expandHomeDir(corePaths.temp),
        },
        data: {
            old: expandHomeDir(coreData,
            new: expandHomeDir(corePaths.data),
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
    // fs.removeSync(`${paths.config.old}/genesisBlock.json`);
    fs.removeSync(`${paths.config.new}/peers_backup.json`);
    fs.removeSync(`${paths.config.new}/network.json`);
    // fs.removeSync(`${paths.config.new}/genesisBlock.json`);

    // Ensure that all files core needs exist
    const requiredFiles = [
        `${paths.config.new}/.env`,
        `${paths.config.new}/delegates.json`,
        `${paths.config.new}/peers.json`,
        `${paths.config.new}/plugins.js`,
    ];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            console.error(`File ${file} does not exist.`);

            // TODO: copy or create file or directory if it doesn't exist
        }
    }

    // Update configuration files
    let configDelegates = require(`${paths.config.new}/delegates.json`)
    delete configDelegates.dynamicFee
    delete configDelegates.dynamicFees
    fs.writeFileSync(`${paths.config.new}/delegates.json`, JSON.stringify(configDelegates, null, 4));

    // Update environment file
    let configEnv = fs.readFileSync(`${paths.config.new}/.env`);
    configEnv = configEnv.replace('ARK_', 'CORE_');
    fs.writeFileSync(`${paths.config.new}/.env`, configEnv);

    // Update plugins file
    let configPlugins = fs.readFileSync(`${paths.config.new}/plugins.js`);
    configPlugins = configPlugins.replace('ARK_', 'CORE_');
    fs.writeFileSync(`${paths.config.new}/plugins.js`, configEnv);

    // TODO: turn plugins.js into plugins.json

    // Validate configuration files
    const { error } = Joi.validate({
        delegates: require(`${paths.config.new}/delegates.json`),
        peers: require(`${paths.config.new}/peers.json`),
        peers_backup: require(`${paths.config.new}/peers_backup.json`),
        plugins: require(`${paths.config.new}/plugins.js`),
        genesisBlock: require(`${paths.config.new}/genesisBlock.json`),
    }, Joi.object({
        delegates: Joi.object({
            secrets: Joi.array().items(Joi.string()),
            bip38: Joi.string(),
        }),
        peers: Joi.object().required(),
        peers_backup: Joi.array().items(Joi.object()),
        plugins: Joi.object().required(),
        genesisBlock: Joi.object().required(),
    }).unknown());

    if (error) {
        console.log(error);
    }
}

main()
