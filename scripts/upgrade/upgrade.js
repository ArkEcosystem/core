const envPaths = require('env-paths');
const expandHomeDir = require('expand-home-dir');
const fs = require('fs-extra');
const Joi = require('joi');
const prompts = require('prompts');
const { EOL } = require('os');

const main = async () => {
    let {
        corePath,
        coreData,
        coreNetwork
    } = await prompts([{
        type: 'text',
        name: 'corePath',
        initial: expandHomeDir('~/ark-core'),
        message: 'Where is the installation located at? [press ENTER to use default]',
        validate: value => fs.existsSync(value) ? true : `${value} does not exist.`
    }, {
        type: 'text',
        name: 'coreData',
        initial: expandHomeDir('~/.ark'),
        message: 'Where is the configuration located at? [press ENTER to use default]',
        validate: value => fs.existsSync(value) ? true : `${value} does not exist.`
    }, {
        type: 'select',
        name: 'coreNetwork',
        message: 'What network are you on?',
        validate: value => ['mainnet', 'devnet', 'testnet'].includes(value) ? true : `${value} is not a valid network.`,
        choices: [
            { title: 'mainnet', value: 'mainnet' },
            { title: 'devnet', value: 'devnet' },
            { title: 'testnet', value: 'testnet' }
        ],
    }]);

    // Paths
    const corePaths = envPaths('ark', {
        suffix: 'core'
    });

    corePath = expandHomeDir(corePath);

    const paths = {
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

    // update commander file if present
    const commanderEnv = expandHomeDir('~/.commander')

    if (fs.existsSync(commanderEnv)) {
        const commanderContents = fs.readFileSync(commanderEnv).toString();

        if (!commanderContents.includes('CORE_PATH_DATA')) {
            fs.appendFileSync(commanderEnv, `CORE_PATH_DATA=${paths.data.new}${EOL}`);
        }

        if (!commanderContents.includes('CORE_PATH_CONFIG')) {
            fs.appendFileSync(commanderEnv, `CORE_PATH_CONFIG=${paths.config.new}${EOL}`);
        }

        if (!commanderContents.includes('CORE_PATH_CACHE')) {
            fs.appendFileSync(commanderEnv, `CORE_PATH_CACHE=${paths.cache.new}${EOL}`);
        }

        if (!commanderContents.includes('CORE_PATH_LOG')) {
            fs.appendFileSync(commanderEnv, `CORE_PATH_LOG=${paths.log.new}${EOL}`);
        }

        if (!commanderContents.includes('CORE_PATH_TEMP')) {
            fs.appendFileSync(commanderEnv, `CORE_PATH_TEMP=${paths.temp.new}${EOL}`);
        }

        fs.writeFileSync(commanderEnv, commanderContents);
    }

    // Create directories
    for (const value of Object.values(paths)) {
        fs.ensureDirSync(value.new);
    }

    // Ensure we copy the .env file
    if (!fs.existsSync(`${paths.data.old}/.env`)) {
        console.log(`The ${paths.data.old}/.env file does not exist.`)
        process.exit(1);
    }

    const envCurrent = fs.readFileSync(`${paths.data.old}/.env`).toString();

    // Move files & directories
    for (const value of Object.values(paths)) {
        if (fs.existsSync(value.old)) {
            console.error(`Moving ${value.old} to ${value.new}.`);

            fs.moveSync(value.old, value.new, {
                overwrite: true
            });
        } else {
            console.error(`Folder ${value.old} does not exist.`);
        }
    }

    // Move files
    if (fs.existsSync(`${paths.cache.new}/json-rpc.sqlite`)) {
        fs.moveSync(`${paths.cache.new}/json-rpc.sqlite`, `${paths.data.new}/json-rpc.sqlite`);
    }

    if (fs.existsSync(`${paths.cache.new}/transaction-pool-${coreNetwork}.sqlite`)) {
        fs.moveSync(`${paths.cache.new}/transaction-pool-${coreNetwork}.sqlite`, `${paths.data.new}/transaction-pool.sqlite`);
    }

    if (fs.existsSync(`${paths.cache.new}/webhooks.sqlite`)) {
        fs.moveSync(`${paths.cache.new}/webhooks.sqlite`, `${paths.data.new}/webhooks.sqlite`);
    }

    if (fs.existsSync(`${corePaths.log}/core/${coreNetwork}`)) {
        fs.moveSync(`${corePaths.log}/core/${coreNetwork}`, `${paths.log.new}/${coreNetwork}`);
    }

    if (fs.existsSync(`${paths.data.new}/snapshots/${coreNetwork}`)) {
        fs.moveSync(`${paths.data.new}/snapshots/${coreNetwork}`, `${paths.data.new}/snapshots.tmp`)
        fs.rmdirSync(`${paths.data.new}/snapshots`)
        fs.renameSync(`${paths.data.new}/snapshots.tmp`, `${paths.data.new}/snapshots`)
    }

    // Remove old or temp files
    fs.removeSync(`${paths.config.old}/genesisBlock.json`);
    fs.removeSync(`${paths.config.old}/peers_backup.json`);
    fs.removeSync(`${paths.config.old}/network.json`);
    fs.removeSync(`${paths.config.new}/genesisBlock.json`);
    fs.removeSync(`${paths.config.new}/peers_backup.json`);
    fs.removeSync(`${paths.config.new}/network.json`);

    // Ensure that all files core needs exist
    const requiredFiles = [
        {
            copy: `${paths.config.new}/delegates.json`,
            original: `${corePath}/packages/core/src/config/${coreNetwork}/delegates.json`,
        }, {
            copy: `${paths.config.new}/peers.json`,
            original: `${corePath}/packages/core/src/config/${coreNetwork}/peers.json`,
        }, {
            copy: `${paths.config.new}/plugins.js`,
            original: `${corePath}/packages/core/src/config/${coreNetwork}/plugins.js`,
        },
    ];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file.copy)) {
            if (fs.existsSync(file.original)) {
                console.error(`Copying ${file.original} to ${file.copy} because it is missing.`);

                fs.copySync(file.original, file.copy);
            } else {
                console.error(`Original ${file.original} does not exist.`);
            }
        }
    }

    // Update delegate configuration
    console.log('Update delegate configuration');
    let configDelegates = require(`${paths.config.new}/delegates.json`)
    delete configDelegates.dynamicFee
    delete configDelegates.dynamicFees
    fs.writeFileSync(`${paths.config.new}/delegates.json`, JSON.stringify(configDelegates, null, 4));

    // Update environment file
    console.log('Update environment configuration');
    fs.writeFileSync(`${paths.config.new}/.env`, envCurrent.replace(new RegExp('ARK_', 'g'), 'CORE_'));

    // Update plugins file
    console.log('Update plugins configuration');
    let pluginContents = fs.readFileSync(`${paths.config.new}/plugins.js`).toString();
    pluginContents = pluginContents.replace('@arkecosystem/core-transaction-pool-mem', '@arkecosystem/core-transaction-pool');
    pluginContents = pluginContents.replace('"@arkecosystem/core-config": {},', '');
    pluginContents = pluginContents.replace("'@arkecosystem/core-config': {},", '');
    pluginContents = pluginContents.replace(new RegExp('ARK_', 'g'), 'CORE_');
    fs.writeFileSync(`${paths.config.new}/plugins.js`, pluginContents);

    // Validate configuration files
    console.log('Validating configuration');
    const { error } = Joi.validate({
        delegates: require(`${paths.config.new}/delegates.json`),
        peers: require(`${paths.config.new}/peers.json`),
        plugins: require(`${paths.config.new}/plugins.js`),
    }, Joi.object({
        delegates: Joi.object({
            secrets: Joi.array().items(Joi.string()),
            bip38: Joi.string(),
        }),
        peers: Joi.object().required(),
        plugins: Joi.object().required(),
    }).unknown());

    if (error) {
        console.log(error);
    }

    // Clean up
    console.log('Performing clean up');
    for (const value of Object.values(paths)) {
        if (fs.existsSync(value.old)) {
            fs.removeSync(value.old);
        }
    }
}

main()
