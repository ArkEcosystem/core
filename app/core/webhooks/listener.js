const EventEmitter = require('events').EventEmitter

const BlockForgedEvent = require('./events/blocks/forged')

let instance

module.exports = class WebhookListener {
  constructor () {
    this.emitter = new EventEmitter()

    if (!instance) {
      instance = this
    }

    return instance
  }

  emit (event, payload) {
    this.emitter.emit(event, payload)
  }

  subscribe () {
    this.emitter.on('block:forged', (block) => BlockForgedEvent(block))

    return Promise.resolve(instance)
  }
}
