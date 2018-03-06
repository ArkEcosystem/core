const path = require('path')
const fs = require('fs')
const commander = require('commander')
const packageJson = require('../package.json')
const logger = require('app/core/logger')
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

process.on('unhandledRejection', (reason, p) => {
  logger.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${reason}`)

  process.exit(1)
})

const delegateFilePath = path.resolve(commander.config, 'delegates.json')

async function init (password, address) {
  try {
    logger.init(config.server.logging, config.network.name + '-forger')

    const forgerManager = await new ForgerManager(config, password)
    const forgers = await forgerManager.loadDelegates(address)

    logger.info('ForgerManager started with', forgers.length, 'forgers')
    forgerManager.startForging(`http://127.0.0.1:${config.server.port}`)
  } catch (error) {
    logger.error('Fatal Error', error.stack)
    process.exit(1)
  }
}

async function configure () {
  await config.init(commander.config)

  if (config.server.test) {
    return init()
  }

  if (!config.delegates.bip38) {
    inquirer.prompt(bip38EncryptSchema).then((answers) => {
      config.delegates['bip38'] = Delegate.encrypt(answers.secret, commander.config.network, answers.password)

      fs.writeFile(delegateFilePath, JSON.stringify(config.delegates, null, 2), (err) => {
        if (err) {
          throw new Error('Failed to save the encrypted key in file')
        } else {
          return init(answers.password)
        }
      })
    })
  } else {
    inquirer.prompt(bip38DecryptSchema).then((answers) => {
      if (!answers.address || arkjs.crypto.validateAddress(answers.address, config.network.pubKeyHash)) {
        return init(answers.password, answers.address)
      } else {
        throw new Error('Invalid Address Provided')
      }
    })
  }
}

configure()
