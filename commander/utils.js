const pm2 = require('pm2')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')

exports.readConfig = (file) => require(`${process.env.ARK_CONFIG}/${file}.json`)

exports.writeConfig = async (file, data) => writeFile(`${process.env.ARK_CONFIG}/${file}.json`, JSON.stringify(data, null, 2))

exports.splash = async () => {
  clear()

  console.log(chalk.blue(figlet.textSync('ARK Core 2.0', { font: 'isometric3' })))
}

exports.onCancel = prompt => require('./commands/start')()

exports.startProcess = (options) => {
  pm2.connect((error) => {
    if (error) {
      console.log(chalk.bgRed(error.message))
      process.exit(2)
    }

    pm2.start(options, (error, apps) => {
      pm2.disconnect()

      if (error) {
        console.log(chalk.bgRed(error.message))
        process.exit(2)
      } else {
        console.log(chalk.green('started'))
      }
    })
  })
}

exports.stopProcess = (pid, callback) => {
  pm2.connect((error) => {
    if (error) {
      console.log(chalk.bgRed(error.message))
      process.exit(2)
    }

    pm2.stop(pid, (error, apps) => {
      pm2.disconnect()

      if (error) {
        console.log(chalk.bgRed(error.message))
        process.exit(2)
      } else {
        callback()
      }
    })
  })
}

exports.getProcessStatus = (callback) => {
  pm2.connect((error) => {
    if (error) {
      console.log(chalk.bgRed(error.message))
      process.exit(2)
    }

    pm2.list((error, processes) => {
      pm2.disconnect()

      if (error) {
        console.log(chalk.bgRed(error.message))
        process.exit(2)
      } else {
        const getProcess = (prefix, name) => {
          const relay = processes.filter(e => e.name === name)[0]
          process.env[`${prefix}_PID`] = relay ? relay.pid : 0
          process.env[`${prefix}_STATUS`] = relay ? relay.pm2_env.status : 'offline'
        }

        getProcess('ARK_RELAY', 'ark-core:relay')
        getProcess('ARK_FORGER', 'ark-core:forger')
        getProcess('ARK_RELAY_FORGER', 'ark-core:relay-and-forger')

        if (callback instanceof Function) callback()
      }
    })
  })
}
