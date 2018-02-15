const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const DB = require('app/core/dbinterface')
const DependencyHandler = require('app/core/dependency-handler')
const config = require('app/core/config')
const goofy = require('app/core/goofy')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

async function boot () {
  try {
    await config.init({
      server: require(path.resolve(commander.config, 'server')),
      genesisBlock: require(path.resolve(commander.config, 'genesis-block.json')),
      network: require(path.resolve(commander.config, 'network'))
    })

    goofy.init(config.server.logging.console, config.server.logging.file, config.network.name)

    await DependencyHandler.checkDatabaseLibraries(config)
    const db = await DB.create(config.server.db)
    db.snapshot(`${__dirname}/storage/snapshot`)

    goofy.info('Snapshot saved')
  } catch (error) {
      goofy.error('fatal error', error)
  }
}

boot()
