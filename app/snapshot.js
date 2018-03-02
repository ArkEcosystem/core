const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const DB = require('app/core/dbinterface')
const DependencyHandler = require('app/core/dependency-handler')
const config = require('app/core/config')
const logger = require('app/core/logger')

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
  logger.error(`Unhandled Rejection at: ${p} reason: ${reason}`)

  process.exit(1)
})

async function init () {
  try {
    await config.init(commander.config)

    logger.init(config.server.logging, config.network.name)

    await DependencyHandler.checkDatabaseLibraries(config)
    const db = await DB.create(config.server.db)
    db.snapshot(`${__dirname}/storage/snapshot`)

    logger.info('Snapshot saved')
  } catch (error) {
    logger.error('Fatal Error', error.stack)
    process.exit(1)
  }
}

init()
