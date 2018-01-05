const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

let logger = null

class Logger {
  constructor () {
    if (!logger) {
      logger = this
    }
  }

  init (level, network) {
    this.network = network
    this.transports = {}

    this.logger = new winston.Logger({
      level,
      transports: [
        this.consoleTransport(),
        this.rotateTransport()
      ]
    })

    // Add 1 method per logging level (error, info, etc.)
    Object.keys(this.logger.levels).forEach(level => {
      this[level] = this.logger[level]
    })
  }

  // Noop
  ignore() {
  }

  level(level) {
    if (level) {
      this.logger.level = level
    }
    return this.logger.level
  }

  // Returns the console transport (instantiates a new one if necessary)
  consoleTransport() {
    if (!this.transports.console) {
      this.transports.console = new winston.transports.Console()
    }
    return this.transports.console
  }

  // Returns the rotate transport (instantiates a new one if necessary)
  // The rotate transport saves the log to a file
  rotateTransport() {
    if (!this.transports.rotate) {
      this.transports.rotate = new DailyRotateFile({
        filename: `${__dirname}/../logs/ark-node-${this.network}`,
        datePattern: '.yyyy-MM-dd.log',
        zippedArchive: true
      })
    }
    return this.transports.rotate
  }

  /*
   * Removes a transport
   * @param transport Remove this transport. Empty removes all
   */
  mute(transport) {
    const mute = transport => {
      this.logger.remove(this[`${transport}Transport`]())
      delete this.transports[transport]
    }
    if (transport) {
      mute(transport)
    } else {
      mute('console')
      mute('rotate')
    }
  }

  /*
   * Adds a transport
   * @param transport Add this transport. Empty adds all (console & rotate)
   */
  unmute(transport) {
    const unmute = Transport => this.logger.add(Transport)

    switch (transport) {
      case 'console':
        unmute(winston.transports.Console)
        break
      case 'rotate':
        unmute(DailyRotateFile)
        break
      default:
        unmute(winston.transports.Console)
        unmute(DailyRotateFile)
    }
  }
}

module.exports = new Logger()
