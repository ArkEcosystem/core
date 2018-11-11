const EventEmitter = require('eventemitter3')

class Emitter {
  /**
   * Create a new event manager instance.
   * @return {WebhookManager}
   */
  constructor() {
    this.emitter = new EventEmitter()

    return this.emitter
  }
}

module.exports = new Emitter()
