module.exports = class QueueInterface {
  /**
   * Create an instance of the process queue.
   * @param  {Blockchain} blockchain
   * @param  {String} event
   * @return {void}
   */
  constructor(blockchain, event) {
    this.blockchain = blockchain
    this.event = event
  }

  /**
   * Drain the queue.
   * @return {void}
   */
  drain() {
    this.queue.drain = () => this.blockchain.dispatch(this.event)
  }

  /**
   * Pause the queue.
   * @return {void}
   */
  pause() {
    return this.queue.pause()
  }

  /**
   * Flush the queue.
   * @return {void}
   */
  clear() {
    return this.queue.remove(() => true)
  }

  /**
   * Resume the queue.
   * @return {void}
   */
  resume() {
    return this.queue.resume()
  }

  /**
   * Remove the item from the queue.
   * @return {void}
   */
  remove(item) {
    return this.queue.remove(item)
  }

  /**
   * Push the item to the queue.
   * @param {Function} callback
   * @return {void}
   */
  push(callback) {
    return this.queue.push(callback)
  }

  /**
   * Get the length of the queue.
   * @return {void}
   */
  length() {
    return this.queue.length()
  }

  destroy() {
    return this.queue.kill()
  }
}
