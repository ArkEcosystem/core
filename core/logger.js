const winston = require('winston')
require('winston-daily-rotate-file')

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
        new winston.transports.Console(),
        rotatetransport
      ]
    }))
  }
}

module.exports = new Logger()
