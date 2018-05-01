'use strict'

const chalk = require('chalk')
const moment = require('moment')
const emoji = require('node-emoji')

/**
 * The winston message formatter.
 * @param  {Object} info
 * @return {String}
 */
module.exports = (info) => {
  let level = info.level.toUpperCase()
  level = {
    'error': chalk.bold.red(level),
    'warn': chalk.bold.yellow(level),
    'info': chalk.bold.green(level),
    'verbose': chalk.bold.blue(level),
    'debug': chalk.bold.magenta(level),
    'silly': chalk.bold.white(level)
  }[info.level]

  let message = emoji.emojify(info.message) || JSON.stringify(info.meta)
  message = {
    'error': chalk.bold.bgRed(message),
    'warn': chalk.bold.black.bgYellow(message),
    'info': message,
    'verbose': chalk.bold.black.bgBlue(message),
    'debug': chalk.bold.bgMagenta(message),
    'silly': chalk.bold.black.bgWhite(message)
  }[info.level]

  const timestamp = moment(info.timestamp()).format('YYYY-MM-DD HH:mm:ss')

  const dateAndLevel = `[${timestamp}][${level}]:`
  const lineSpacer = ' '.repeat(Math.abs(dateAndLevel.length - 50) + 1)

  return `[${timestamp}][${level}]${lineSpacer}: ${message}`
}
