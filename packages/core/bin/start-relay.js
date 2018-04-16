#!/usr/bin/env node

const commander = require('commander')
const moduleLoader = require('@arkecosystem/core-module-loader')

commander
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

// process.on('unhandledRejection', (reason, p) => console.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${JSON.stringify(reason)}`))

const start = async () => {
  try {
    // Boot the module loader...
    moduleLoader.boot(commander.config)

    // Module Loader has been mounted...
    await moduleLoader.bind('init', { network: commander.config })

    // Store config in variable for re-use
    const config = moduleLoader.get('config')

    // Configuration has been mounted...
    await moduleLoader.bind('beforeCreate', {
      config,
      network: config.network.name
    })

    // Create BlockchainManager
    const blockchainManager = moduleLoader.get('blockchain')

    // Logger has been mounted...
    await moduleLoader.bind('beforeMount', {
      config,
      blockchainManager,
      network: config.network.name
    })

    // Store logger in variable for re-use
    const logger = moduleLoader.get('logger')

    // FIXME: with the module approach we need to figure out a new
    // logger.info('Initialising Dependencies...')
    // await require('../src/dependency-handler').checkDatabaseLibraries(config)

    logger.info('Initialising Blockchain Manager...')

    await blockchainManager.start()
    await blockchainManager.isReady()

    // Blockchain has been mounted...
    await moduleLoader.bind('mounted', {
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
