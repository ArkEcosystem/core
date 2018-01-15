const winston = require('winston')
const human = require('interval-to-human')
require('winston-daily-rotate-file')
require('colors')

let logger = null

class Logger {
  constructor () {
    if (!logger) {
      logger = this
    }
    return logger
  }

  init (level, network) {
    const rotatetransport = new winston.transports.DailyRotateFile({
      filename: `${__dirname}/../logs/ark-node-${network}`,
      datePattern: '.yyyy-MM-dd.log',
      level: level,
      zippedArchive: true
    })

    Object.assign(this, new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          level: level,
          timestamp: true
        }),
        rotatetransport
      ]
    }))
  }

  printTracker (title, progress, percent, remainingSeconds) {
    process.stdout.write('\u{1b}[0G')
    process.stdout.write('  ')
    process.stdout.write(title.blue)
    process.stdout.write(' [')
    process.stdout.write(('='.repeat(progress / 2)).green)
    process.stdout.write(' '.repeat(50 - progress / 2) + '] ')
    if (percent) process.stdout.write(percent + '% ')
    if (remainingSeconds) process.stdout.write(human(remainingSeconds))
    process.stdout.write('\u{1b}[0G')
  }
}

module.exports = new Logger()
