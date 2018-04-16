#!/usr/bin/env node

const commander = require('commander')
const config = require('@arkecosystem/core-pluggy').get('config')
const logger = require('@arkecosystem/core-pluggy').get('logger')

commander
  .version(require('../package.json').version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => logger.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`))

config.init(commander.config)
