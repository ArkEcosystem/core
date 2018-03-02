const winston = require('winston')
const chalk = require('chalk')
const moment = require('moment')
require('winston-daily-rotate-file')
require('colors')

const winstonConsoleFormatter = (info) => {
  let level = info.level.toUpperCase()
  level = {
    'error': chalk.bold.red(level),
    'warn': chalk.bold.yellow(level),
    'info': chalk.bold.green(level),
    'verbose': chalk.bold.blue(level),
    'debug': chalk.bold.magenta(level),
    'silly': chalk.bold.white(level)
  }[info.level]

  let message = info.message
  message = {
    'error': chalk.bold.bgRed(message),
    'warn': chalk.bold.black.bgYellow(message),
    'info': message,
    'verbose': chalk.bold.black.bgBlue(message),
    'debug': chalk.bold.inverse(message),
    'silly': chalk.bold.black.bgWhite(message)
  }[info.level]

  const timestamp = moment(info.timestamp()).format('YYYY-MM-DD HH:mm:ss')

  const dateAndLevel = `[${timestamp}][${level}]:`
  const lineSpacer = ' '.repeat(Math.abs(dateAndLevel.length - 50) + 1)

  return `[${timestamp}][${level}]${lineSpacer}: ${message}`
}

class Logger {
  constructor () {
    this.winston = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          colorize: true,
          level: 'debug',
          timestamp: () => Date.now(),
          formatter: (info) => winstonConsoleFormatter(info)
        })
      ]
    })

    this.winston.filters.push((level, message, meta) => {
      if (this.tracker) {
        process.stdout.write('\u{1b}[0G                                                                                                     \u{1b}[0G')
        this.tracker = false
      }

      return message
    })
  }

  init (config, network) {
    this.winston.clear()

    this.winston.add(winston.transports.DailyRotateFile, {
      filename: `${__dirname}/../../storage/logs/ark-node-${network}`,
      datePattern: '.yyyy-MM-dd.log',
      level: config.file,
      zippedArchive: true
    })

    this.winston.add(winston.transports.Console, {
      colorize: true,
      level: config.console,
      timestamp: () => Date.now(),
      formatter: (info) => winstonConsoleFormatter(info)
    })

    Object.assign(this, this.winston)
  }

  printTracker (title, current, max, posttitle, figures = 0) {
    const progress = 100 * current / max
    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    line += progress.toFixed(figures) + '% '
    if (posttitle) line += posttitle + '                     '
    process.stdout.write(line)
    this.tracker = true
  }

  stopTracker (title, current, max) {
    const progress = 100 * current / max
    let line = '\u{1b}[0G  '
    line += title.blue
    line += ' ['
    line += ('='.repeat(progress / 2)).green
    line += ' '.repeat(50 - progress / 2) + '] '
    line += progress.toFixed(0) + '% '
    if (current === max) line += '✔️'
    line += '                              \n'
    process.stdout.write(line)
    this.tracker = false
  }
}

module.exports = new Logger()
