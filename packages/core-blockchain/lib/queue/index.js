const ProcessQueue = require('./process')
const RebuildQueue = require('./rebuild')

module.exports = class Queue {
  /**
   * Create an instance of the queue.
   * @param  {Blockchain} blockchain
   * @param  {Object} events
   * @return {void}
   */
  constructor (blockchain, events) {
    this.process = new ProcessQueue(blockchain, events.process)
    this.rebuild = new RebuildQueue(blockchain, events.rebuild)
  }

  /**
   * Pause all queues.
   * @return {void}
   */
  pause () {
    this.rebuild.pause()
    this.process.pause()
  }

  /**
   * Flush all queues.
   * @return {void}
   */
  clear () {
    this.rebuild.clear()
    this.process.clear()
  }

  /**
   *  Resue all queues.
   * @return {void}
   */
  resume () {
    this.rebuild.resume()
    this.process.resume()
  }

  destroy () {
    this.rebuild.destroy()
    this.process.destroy()
  }
}
