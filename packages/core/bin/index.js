#!/usr/bin/env node

const app = require('commander')
const pluginManager = require('@arkecosystem/core-plugin-manager')

app.version(require('../package.json').version)

function crit(msg) {
  console.error(msg)
  process.exit(1)
}

/**
 * START A RELAY AND FORGER NODE
 */
app
  .command('start [config]')
  .description('start a relay and forger node')
  .option('-b, --bip38 <bip38>', 'forger bip38')
  .option('-a, --address <address>', 'forger address')
  .option('-p, --password <password>', 'forger password')
  .option('--network-start', 'force genesis network start')
  .option('-v, --verbose', 'give verbose error messages')
  .action(async(config, options) => {
    try {
      await require('./commands/start-relay-and-forger')(config, options)
    } catch (err) {
      if (options.verbose) {
        throw err
      } else {
        crit(err.toString())
      }
    }
  })

/**
 * START A RELAY NODE
 */
app
  .command('relay [config]')
  .description('start a relay node')
  .option('-v, --verbose', 'give verbose error messages')
  .action(async(config, options) => {
    try {
      await require('./commands/start-relay')(config, options)
    } catch (err) {
      if (options.verbose) {
        throw err
      } else {
        crit(err.toString())
      }
    }
  })

/**
 * TAKE A SNAPSHOT
 */
app
  .command('snapshot [config]')
  .description('take a snapshot of the database')
  .option('-v, --verbose', 'give verbose error messages')
  .action(async(config, options) => {
    try {
      await require('./commands/snapshot')(config, options)
    } catch (err) {
      if (options.verbose) {
        throw err
      } else {
        crit(err.toString())
      }
    }
  })

/**
 * START A FORGER NODE
 */
app
  .command('forger [config]')
  .description('start a forger node')
  .option('-b, --bip38 <bip38>', 'forger bip38')
  .option('-a, --address <address>', 'forger address')
  .option('-p, --password <password>', 'forger password')
  .option('--network-start', 'force genesis network start')
  .option('-v, --verbose', 'give verbose error messages')
  .action(async(config, options) => {
    try {
      await require('./commands/start-forger')(config, options)
    } catch (err) {
      if (options.verbose) {
        throw err
      } else {
        crit(err.toString())
      }
    }
  })

/**
 * FALLBACK
 */
app
  .command('*')
  .action(function(env) {
    app.help()
    process.exit(0)
  })

/**
 * PARSE
 */
app.parse(process.argv)
