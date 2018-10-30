'use strict'

const Emittery = require('emittery')

class Emitter {
  /**
   * Create a new event manager instance.
   * @return {WebhookManager}
   */
  constructor () {
    this.emitter = new Emittery()

    return this.emitter
  }
}

module.exports = new Emitter()
