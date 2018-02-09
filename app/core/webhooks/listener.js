const EventEmitter = require('events').EventEmitter
const goofy = require('app/core/goofy')
const WebhookTransmitter = require('./transmitter')

let instance

module.exports = class WebhookListener {
  constructor (webhooks) {
    this.webhooks = webhooks
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

      const webhooks = this.webhooks.filter(w => (w.event === 'block:forged'))

      webhooks.forEach((webhook) => {
        WebhookTransmitter(webhook, block)
          .then((r) => goofy.info(`Event [block:forged] transmitted to [${webhook.options.hook.url}] with Status [${r.status}].`))
          .catch((e) => goofy.error(e.message))
      })
    })

    return Promise.resolve(instance)
  }
}
