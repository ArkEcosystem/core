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
        coreData,
        coreNetwork
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
    }, {
        type: 'text',
        name: 'coreNetwork',
        message: 'What network are you on?',
        choices: [
            { title: 'mainnet', value: 'mainnet' },
            { title: 'devnet', value: 'devnet' },
            { title: 'testnet', value: 'testnet' }
        ],
    }]);

    deletePM2('ark-core');
    deletePM2('ark-core-relay');
    deletePM2('ark-core-forger');

    deletePM2('core');
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
            new: `${corePaths.cache}/${coreNetwork}`,
        },
        config: {
            old: expandHomeDir(`${coreData}/config`),
            new: `${corePaths.config}/${coreNetwork}`,
        },
        log: {
            old: expandHomeDir(`${coreData}/logs`),
            new: `${corePaths.log}/${coreNetwork}`,
        },
        temp: {
            old: expandHomeDir(`${coreData}/temp`),
            new: `${corePaths.temp}/${coreNetwork}`,
        },
        data: {
            old: expandHomeDir(coreData),
            new: `${corePaths.data}/${coreNetwork}`,
        },
    };

    // Ensure we copy the .env file
    if (fs.existsSync(`${paths.data.old}/.env`)) {
        fs.ensureDirSync(paths.config.new);

        fs.moveSync(`${paths.data.old}/.env`, `${paths.config.new}/.env`);

        fs.removeSync(`${paths.data.old}/.env`);
    } else {
        console.log('The .env file ')
        process.exit(1);
    }

    // Move files & directories
    for (const value of Object.values(paths)) {
        if (fs.existsSync(value.old)) {
            console.error(`Moving ${value.old} to ${value.new}.`);

            fs.ensureDirSync(value.new);

            fs.moveSync(value.old, value.new, {
                overwrite: true
            });

            fs.removeSync(value.old);
        } else {
            console.error(`Folder ${value.old} does not exist.`);
        }
    }

    // Move database files
    if (fs.existsSync(`${paths.cache.new}/json-rpc.sqlite`)) {
        fs.moveSync(`${paths.cache.new}/json-rpc.sqlite`, `${paths.data.new}/json-rpc.sqlite`);
    }

    if (fs.existsSync(`${paths.cache.new}/transaction-pool.sqlite`)) {
        fs.moveSync(`${paths.cache.new}/transaction-pool.sqlite`, `${paths.data.new}/transaction-pool.sqlite`);
    }

    if (fs.existsSync(`${paths.cache.new}/webhooks.sqlite`)) {
        fs.moveSync(`${paths.cache.new}/webhooks.sqlite`, `${paths.data.new}/webhooks.sqlite`);
    }

    // Remove old or temp files
    fs.removeSync(`${paths.config.old}/peers_backup.json`);
    fs.removeSync(`${paths.config.old}/network.json`);
    fs.removeSync(`${paths.config.new}/peers_backup.json`);
    fs.removeSync(`${paths.config.new}/network.json`);

    // Ensure that all files core needs exist
    const requiredFiles = [
        {
            copy: `${paths.config.new}/.env`,
            original: null, // NOTE: this should never happen
        }, {
            copy: `${paths.config.new}/delegates.json`,
            original: `${paths.core.new}/packages/core/src/config/${coreNetwork}/delegates.json`,
        }, {
            copy: `${paths.config.new}/peers.json`,
            original: `${paths.core.new}/packages/core/src/config/${coreNetwork}/peers.json`,
        }, {
            copy: `${paths.config.new}/plugins.js`,
            original: `${paths.core.new}/packages/core/src/config/${coreNetwork}/plugins.js`,
        }
    ];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file.copy)) {
            console.error(`File ${file.copy} does not exist.`);

            if (fs.existsSync(file.original)) {
                console.error(`Copying ${file.original} to ${file.copy}.`);

                fs.copySync(file.original, file.copy);
            } else {
                console.error(`Original ${file.original} does not exist.`);
            }
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
        plugins: require(`${paths.config.new}/plugins.js`),
        genesisBlock: require(`${paths.config.new}/genesisBlock.json`),
    }, Joi.object({
        delegates: Joi.object({
            secrets: Joi.array().items(Joi.string()),
            bip38: Joi.string(),
        }),
        peers: Joi.object().required(),
        plugins: Joi.object().required(),
        genesisBlock: Joi.object().required(),
    }).unknown());

    if (error) {
        console.log(error);
    }
}

main()
