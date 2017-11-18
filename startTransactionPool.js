const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const config = require('./core/config')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

if (commander.config) {
  config.init({
    server: require(path.resolve(commander.config, 'server.json')),
    genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
    network: require(path.resolve(commander.config, 'network.json'))
  })
}
