#!/usr/bin/env node

const commander = require('commander')
const packageJson = require('../package.json')
const config = require('@arkecosystem/core-config')
const logger = require('@arkecosystem/core-logger')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => logger.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`))

config.init(commander.config)
