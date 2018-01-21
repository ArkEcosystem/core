const logger = require('./logger')
const BaseEventEmitter = require('events')

let instance

module.exports = class EventEmitter extends BaseEventEmitter {
  constructor () {
    super()

    if (!instance) {
      logger.debug('EventEmitter has been instantiated.');

      instance = this
    } else {
      logger.debug('EventEmitter already instantiated.');
    }

    return instance
  }

  static getInstance () {
    return instance
  }
}
