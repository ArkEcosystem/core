const EventEmitter = require('events').EventEmitter
const goofy = require('app/core/goofy')
const db = require('app/core/dbinterface').getInstance()
const WebhookTransmitter = require('./transmitter')

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
    this.emitter.on('block:forged', (block) => {
      goofy.debug('Event [block:forged] fired.')

      db.webhooks.findByEvent('block:forged').then(webhooks => {
        webhooks.forEach((webhook) => {
          WebhookTransmitter(webhook, block)
          .then((r) => goofy.info(`Event [block:forged] transmitted to [${webhook.options.hook.url}] with Status [${r.status}].`))
          .catch((e) => goofy.error(e.message))
        })
      })
    })

    return Promise.resolve(instance)
  }
}
