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
    pluggy.boot(commander.config)
    pluggy.setState({ network: commander.config })

    await pluggy.register('init')

    pluggy.setState({
      config: pluggy.get('config'),
      network: pluggy.get('config').network.name
    })

    await pluggy.register('beforeCreate')

    const blockchainManager = pluggy.get('blockchain')
    pluggy.setState({ blockchainManager })

    await pluggy.register('beforeMount')

    pluggy.get('logger').info('Initialising Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    await pluggy.register('mounted')
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()

// FIXME: with the module approach we need to figure out a new
// logger.info('Initialising Dependencies...')
// await require('../src/dependency-handler').checkDatabaseLibraries(config)
