const winston = require('winston')
const formatter = require('./formatter')
require('winston-daily-rotate-file')
require('colors')

module.exports = class Logger {
  init (config, network) {
    this.winston = new (winston.Logger)()

    this.winston.add(winston.transports.DailyRotateFile, {
      filename: `${__dirname}/../../storage/logs/ark-node-${network}`,
      datePattern: '.yyyy-MM-dd.log',
      level: config.file,
      zippedArchive: true,
      formatter: (info) => formatter(info)
    })

    this.winston.add(winston.transports.Console, {
      colorize: true,
      level: config.console,
      timestamp: () => Date.now(),
      formatter: (info) => formatter(info)
    })

    this.winston.filters.push((level, message, meta) => {
      if (this.tracker) {
        process.stdout.write('\u{1b}[0G                                                                                                     \u{1b}[0G')
        this.tracker = null
      }

      return message
    })
  }

  error (message) {
    return this.winston.error(message)
  }

  warning (message) {
    return this.winston.warn(message)
  }

  info (message) {
    return this.winston.info(message)
  }

  debug (message) {
    return this.winston.debug(message)
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
    this.tracker = line
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
    this.tracker = null
  }
}
