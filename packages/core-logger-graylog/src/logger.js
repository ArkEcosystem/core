const graylog2 = require('graylog2')

class Logger {
  init (config) {
    this.graylog = new graylog2.graylog(config) // eslint-disable-line new-cap
  }

  error (message) {
    return this.graylog.error(message)
  }

  warning (message) {
    return this.graylog.warning(message)
  }

  info (message) {
    return this.graylog.info(message)
  }

  debug (message) {
    return this.graylog.debug(message)
  }

  printTracker (title, current, max, posttitle, figures = 0) {}
  stopTracker (title, current, max) {}
}

module.exports = new Logger()
