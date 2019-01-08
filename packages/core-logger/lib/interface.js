module.exports = class LoggerInterface {
  /**
   * Create a new logger instance.
   * @param  {Object} options
   */
  constructor(options) {
    this.options = options
  }

  /**
   * Get a driver instance.
   * @return {LoggerInterface}
   */
  driver() {
    return this.driver
  }

  /**
   * Log an error message.
   * @param  {*} message
   * @return {void}
   */
  error(message) {
    throw new Error('Method [error] not implemented!')
  }

  /**
   * Log a warning message.
   * @param  {*} message
   * @return {void}
   */
  warn(message) {
    throw new Error('Method [warn] not implemented!')
  }

  /**
   * Log an info message.
   * @param  {*} message
   * @return {void}
   */
  info(message) {
    throw new Error('Method [info] not implemented!')
  }

  /**
   * Log a debug message.
   * @param  {*} message
   * @return {void}
   */
  debug(message) {
    throw new Error('Method [debug] not implemented!')
  }

  /**
   * Print the progress tracker.
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @param  {String} postTitle
   * @param  {Number} figures
   * @return {void}
   */
  printTracker(title, current, max, postTitle, figures = 0) {
    throw new Error('Method [printTracker] not implemented!')
  }

  /**
   * Stop the progress tracker.
   * @param  {String} title
   * @param  {Number} current
   * @param  {Number} max
   * @return {void}
   */
  stopTracker(title, current, max) {
    throw new Error('Method [stopTracker] not implemented!')
  }

  /**
   * Suppress console output.
   * @param  {Boolean}
   * @return {void}
   */
  suppressConsoleOutput(suppress) {
    throw new Error('Method [suppressConsoleOutput] not implemented!')
  }
}
