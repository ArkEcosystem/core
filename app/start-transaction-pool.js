const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const config = require('app/core/config')
commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

async function boot () {
  await config.init({
    server: require(path.resolve(commander.config, 'server')),
    genesisBlock: require(path.resolve(commander.config, 'genesis-block.json')),
    network: require(path.resolve(commander.config, 'network'))
  })
}

boot()
