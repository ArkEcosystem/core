class Logger {
  constructor() {
    this.logger = console
  }

  setLogger(logger) {
    this.logger = logger
  }

  error(message) {
    this.logger.error(message)
  }

  warn(message) {
    this.logger.warn(message)
  }

  info(message) {
    this.logger.info(message)
  }

  debug(message) {
    this.logger.debug(message)
  }
}

module.exports = new Logger()
