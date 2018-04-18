#!/usr/bin/env node

const commander = require('commander')
const pluginManager = require('@arkecosystem/core-plugin-manager')

commander
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

// process.on('unhandledRejection', (reason, p) => console.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${JSON.stringify(reason)}`))

const start = async () => {
  try {
    pluginManager.init(commander.config)
    pluginManager.setState({ network: commander.config })

    await pluginManager.hook('init')

    pluginManager.setState({
      config: pluginManager.get('config'),
      network: pluginManager.get('config').network.name
    })

    await pluginManager.hook('beforeCreate')

    const blockchainManager = pluginManager.get('blockchain')
    pluginManager.setState({ blockchainManager })

    await pluginManager.hook('beforeMount')

    // pluginManager.get('logger').info('Starting Blockchain Manager...')
    // await blockchainManager.start()
    // await blockchainManager.isReady()

    await pluginManager.hook('mounted')
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()

// FIXME: with the module approach we need to figure out a new
// logger.info('Starting Dependencies...')
// await require('../src/dependency-handler').checkDatabaseLibraries(config)
