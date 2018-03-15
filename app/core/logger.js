const path = require('path')

class Logger {
  async init (config, network) {
    this.logger = new (require(path.resolve(config.driver)))()

    return this.logger.init(config, network)
  }

  error (message) {
    return this.logger.error(message)
  }

  warning (message) {
    return this.logger.warning(message)
  }

  info (message) {
    return this.logger.info(message)
  }

  debug (message) {
    return this.logger.debug(message)
  }

  printTracker (title, current, max, posttitle, figures = 0) {
    this.logger.printTracker(title, current, max, posttitle, figures)
  }

  stopTracker (title, current, max) {
    this.logger.stopTracker(title, current, max)
  }
}

module.exports = new Logger()
