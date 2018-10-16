'use strict'

const { format } = require('winston')
const chalk = require('chalk')
const moment = require('moment')
const emoji = require('node-emoji')

const { colorize, combine, timestamp, printf } = format

module.exports = (colorOutput = true) => combine(
  colorize(),
  timestamp(),
  printf(info => {
    const infoLevel = info[Symbol.for('level')]

    let level = infoLevel.toUpperCase()
    let message = emoji.emojify(info.message) || JSON.stringify(info.meta)

    if (colorOutput) {
      level = {
        'error': chalk.bold.red(level),
        'warn': chalk.bold.yellow(level),
        'info': chalk.bold.blue(level),
        'verbose': chalk.bold.cyan(level),
        'debug': chalk.bold.white(level),
        'silly': chalk.bold.magenta(level)
      }[infoLevel]

      message = {
        'error': chalk.bold.bgRed(message),
        'warn': chalk.bold.black.bgYellow(message),
        'info': message,
        'verbose': chalk.bold.cyan(message),
        'debug': chalk.black.bgWhite(message),
        'silly': chalk.bold.black.bgWhite(message)
      }[infoLevel]
    }

    const timestamp = moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss')

    const dateAndLevel = `[${timestamp}][${level}]:`
    const lineSpacer = ' '.repeat(Math.abs(dateAndLevel.length - 50) + 1)

    return `[${timestamp}][${level}]${lineSpacer}: ${message}`
  })
)
