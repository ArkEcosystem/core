const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const logger = require('./core/logger')
const ForgerManager = require('./core/forgerManager')
const inquirer = require('inquirer');

const schema = [{
  type: 'password',
  message: 'Secret:',
  name: 'secret',
  mask: '*'
}, {
  type: 'password',
  message: 'Password:',
  name: 'password',
  mask: '*'
}]

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-e, --encrypt', 'encrypt the secret using bip38')
  .option('-d, --decrypt', 'decrypt the bip38 seed')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

const delegateFilePath = path.resolve(commander.config, 'delegate.json')

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

require('./core/config').init({
  server: require(path.resolve(commander.config, 'server.json')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network.json')),
  delegates: require(delegateFilePath)
}).then(config => {
  if (!config.delegates.bip38) {
    inquirer.prompt(schema).then((answers) => {
      config.delegates['bip38'] = Delegate.encrypt(answers.secret, commander.config.network, answers.password)

      fs.writeFile(delegateFilePath, JSON.stringify(config.delegates), (err) => {
        if (err) {
          throw new Error('Failed to save the encrypted key in file')
        } else {
          init(answers.password)
        }
      })
    })
  } else {
    inquirer.prompt([ schema[1] ]).then((answers) => {
      init(answers.password)
    })
  }
})

function init (password) {
  require('./core/config').init({
    server: require(path.resolve(commander.config, 'server.json')),
    genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
    network: require(path.resolve(commander.config, 'network.json')),
    delegates: require(path.resolve(commander.config, 'delegate.json'))
  }).then(config => {
    logger.init(config.server.fileLogLevel, config.network.name + '-forger')

    let forgerManager = new ForgerManager(config, password)

    process.on('unhandledRejection', (reason, p) => {
      logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
    })

    forgerManager
      .loadDelegates()
      .then((forgers) => logger.info('ForgerManager started with', forgers.length, 'forgers'))
      .then(() => forgerManager.startForging('http://127.0.0.1:4000'))
      .catch((fatal) => logger.error('fatal error', fatal))
  })
}
