#!/usr/bin/env node

const commander = require('commander')
const pluggy = require('@arkecosystem/core-pluggy')

commander
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

// process.on('unhandledRejection', (reason, p) => console.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${JSON.stringify(reason)}`))

const start = async () => {
  try {
    // Boot the module loader...
    pluggy.boot(commander.config)

    // Module Loader has been mounted...
    await pluggy.bind('init', { network: commander.config })

    // Store config in variable for re-use
    const config = pluggy.get('config')

    // Configuration has been mounted...
    await pluggy.bind('beforeCreate', {
      config,
      network: config.network.name
    })

    // Create BlockchainManager
    const blockchainManager = pluggy.get('blockchain')

    // Logger has been mounted...
    await pluggy.bind('beforeMount', {
      config,
      blockchainManager,
      network: config.network.name
    })

    // Store logger in variable for re-use
    const logger = pluggy.get('logger')

    // FIXME: with the module approach we need to figure out a new
    // logger.info('Initialising Dependencies...')
    // await require('../src/dependency-handler').checkDatabaseLibraries(config)

    logger.info('Initialising Blockchain Manager...')

    await blockchainManager.start()
    await blockchainManager.isReady()

    // Blockchain has been mounted...
    await pluggy.bind('mounted', {
      config,
      blockchainManager,
      network: config.network.name
    })
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()
