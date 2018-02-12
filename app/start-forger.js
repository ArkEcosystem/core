const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const goofy = require('app/core/goofy')
const ForgerManager = require('app/core/managers/forger')
const inquirer = require('inquirer');
const Delegate = require('./model/delegate')

const bip38EncryptSchema = [{
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
const bip38DecryptSchema = [
  {
    message: 'Public Key:',
    name: 'publicKey'
  },
  bip38EncryptSchema[1]
]

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

const config = require('app/core/config')
let forgerManager = null
let forgers = null

config.init({
  server: require(path.resolve(commander.config, 'server')),
  genesisBlock: require(path.resolve(commander.config, 'genesisBlock.json')),
  network: require(path.resolve(commander.config, 'network')),
  delegates: require(delegateFilePath)
}).then(config => {
  if (!config.delegates.bip38) {
    inquirer.prompt(bip38EncryptSchema).then((answers) => {
      config.delegates['bip38'] = Delegate.encrypt(answers.secret, commander.config.network, answers.password)

      fs.writeFile(delegateFilePath, JSON.stringify(config.delegates, null, 2), (err) => {
        if (err) {
          throw new Error('Failed to save the encrypted key in file')
        } else {
          init(answers.password)
        }
      })
    })
  } else {
    inquirer.prompt(bip38DecryptSchema).then((answers) => {
      init(answers.password, answers.publicKey)
    })
  }
})

function init (password, publicKey) {
  process.on('unhandledRejection', (reason, p) => {
    goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
  })

  config.init({
    server: require(path.resolve(commander.config, 'server')),
    genesisBlock: require(path.resolve(commander.config, 'genesis-block.json')),
    network: require(path.resolve(commander.config, 'network')),
    delegates: require(delegateFilePath)
  })
    .then(() => goofy.init(config.server.logging.console, config.server.logging.file, config.network.name + '-forger'))
    .then(() => (forgerManager = new ForgerManager(config, password)))
    .then(() => (forgers = forgerManager.loadDelegates(publicKey)))
    .then(() => goofy.info('ForgerManager started with', forgers.length, 'forgers'))
    .then(() => forgerManager.startForging('http://127.0.0.1:4000'))
    .catch((fatal) => goofy.error('fatal error', fatal))
}
