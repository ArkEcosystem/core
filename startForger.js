const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('./package.json')
const path = require('path')
const logger = require('./core/logger')
const ForgerManager = require('./core/forgerManager')
const prompt = require('prompt')
const Delegate = require('./model/delegate')

const schema = {
  properties: {
    secret: {
      required: true
    },
    password: {
      hidden: true,
      required: true
    }
  }
}

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-e, --encrypt', 'encrypt the secret using bip38')
  .option('-d, --decrypt', 'decrypt the bip38 seed')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

if (commander.encrypt) {
  prompt.start()
  prompt.get(schema, (err, result) => {
    if (err) throw Error(err)

    const encryptedKey = Delegate.encrypt(result.secret, commander.config.network, result.password)
    const delegateFilePath = path.resolve(commander.config, 'delegate.json')
    const delegates = JSON.parse(fs.readFileSync(delegateFilePath || {}))

    delegates['secrets'] = [...delegates['secrets'], encryptedKey]

    fs.writeFile(delegateFilePath, JSON.stringify(delegates), (err) => {
      if (err) throw new Error('Failed to save the encrypted key in file')
    })
  })
}

if (commander.decrypt) {
  prompt.start()
  const properties = { password: schema.properties.password }

  prompt.get({properties}, (err, result) => {
    if (err) throw Error(err)

    init(result.password)
  })
} else {
  init()
}

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
