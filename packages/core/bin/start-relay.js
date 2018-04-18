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
    pluggy.init(commander.config)
    pluggy.setState({ network: commander.config })

    await pluggy.hook('init')

    pluggy.setState({
      config: pluggy.get('config'),
      network: pluggy.get('config').network.name
    })

    await pluggy.hook('beforeCreate')

    const blockchainManager = pluggy.get('blockchain')
    pluggy.setState({ blockchainManager })

    await pluggy.hook('beforeMount')

    // pluggy.get('logger').info('Starting Blockchain Manager...')
    // await blockchainManager.start()
    // await blockchainManager.isReady()

    await pluggy.hook('mounted')
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()

// FIXME: with the module approach we need to figure out a new
// logger.info('Starting Dependencies...')
// await require('../src/dependency-handler').checkDatabaseLibraries(config)
