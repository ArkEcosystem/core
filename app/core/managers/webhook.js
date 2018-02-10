const axios = require('axios')
const map = require('lodash/map')
const EventEmitter = require('events').EventEmitter
const db = require('app/core/dbinterface')
const goofy = require('app/core/goofy')
const queue = require('app/core/managers/queue')

let instance

module.exports = class WebhookListener {
  constructor (config) {
    this.config = config

    this.emitter = new EventEmitter()
    this.queue = queue.getInstance().connection('webhooks')

    if (!instance) {
      instance = this
    }

    return instance
  }

  mount () {
    map(this.config.events, 'name').forEach((event) => {
      this.emitter.on(event, (payload) => {
        db.getInstance().webhooks.findByEvent(event).then(webhooks => {
          webhooks.forEach((webhook) => this.queue.add({ webhook: webhook, payload: payload }))
        })
      })
    })

    this.queue.process((job) => {
      return axios.post(job.data.webhook.target, {
        formParams: job.data.payload,
        headers: { 'X-Hook-Token': job.data.webhook.token }
      }).then((response) => ({
        status: response.status,
        headers: response.headers,
        data: response.data
      })).catch((e) => goofy.error(`Job ${job.id} failed! ${e.message}`))
    })

    this.queue.on('completed', (job, result) => {
      goofy.debug(`Job ${job.id} completed! Event [${job.data.webhook.event}] has been transmitted to [${job.data.webhook.target}] with a status of [${result.status}].`)

      job.remove()
    })
  }

  emit (event, payload) {
    this.emitter.emit(event, payload)
  }
}
