const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const goofy = require('app/core/goofy')
const ForgerManager = require('app/core/managers/forger')
const inquirer = require('inquirer');
const Delegate = require('app/models/delegate')
const arkjs = require('arkjs')
const config = require('app/core/config')

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
    message: 'Address:',
    name: 'address'
  },
  bip38EncryptSchema[1]
]

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

const delegateFilePath = path.resolve(commander.config, 'delegate.json')

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

async function boot (password, address) {
  try {
    goofy.init(config.server.logging.console, config.server.logging.file, config.network.name + '-forger')

    const forgerManager = await new ForgerManager(config, password)
    const forgers = await forgerManager.loadDelegates(address)

    goofy.info('ForgerManager started with', forgers.length, 'forgers')
    forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)
  } catch (error) {
    goofy.error('fatal error', error)
  }
}

async function configureDelegateEncryption () {
  if (!config.delegates.bip38) {
    inquirer.prompt(bip38EncryptSchema).then((answers) => {
      config.delegates['bip38'] = Delegate.encrypt(answers.secret, commander.config.network, answers.password)

      fs.writeFile(delegateFilePath, JSON.stringify(config.delegates, null, 2), (err) => {
        if (err) {
          throw new Error('Failed to save the encrypted key in file')
        } else {
          boot(answers.password)
        }
      })
    })
  } else {
    inquirer.prompt(bip38DecryptSchema).then((answers) => {
      if (arkjs.crypto.validateAddress(answers.address, config.network.pubKeyHash)) {
        boot(answers.password, answers.address)
      } else {
        throw new Error('Invalid Address Provided')
      }
    })
  }
}

async function configure () {
  await config.init({
    server: require(path.resolve(commander.config, 'server')),
    genesisBlock: require(path.resolve(commander.config, 'genesis-block.json')),
    network: require(path.resolve(commander.config, 'network')),
    delegates: require(delegateFilePath)
  })

  if (config.server.delegateEncryption) {
    await configureDelegateEncryption()
  } else {
    boot()
  }
}

configure()
