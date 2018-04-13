#!/usr/bin/env node

const assert = require('assert-plus')
const commander = require('commander')
const expandHomeDir = require('expand-home-dir')
const fs = require('fs')
const path = require('path')

const config = require('@arkecosystem/core-config')
const DB = require('@arkecosystem/core-database')
const logger = require('@arkecosystem/core-logger')

const packageJson = require('../package.json')

const DependencyHandler = require('../src/dependency-handler')

commander
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

process.on('unhandledRejection', (reason, p) => {
  logger.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`)

  process.exit(1)
})

const start = async () => {
  try {
    await config.init(commander.config)

    logger.init(config.server.logging, config.network.name)

    await DependencyHandler.checkDatabaseLibraries(config)
    const db = await DB.create(config.server.database)
    db.snapshot(expandHomeDir(config.server.database.snapshots))

    logger.info('Snapshot saved')
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()
