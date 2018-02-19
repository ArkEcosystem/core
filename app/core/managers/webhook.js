const axios = require('axios')
const map = require('lodash/map')
const EventEmitter = require('events').EventEmitter
const db = require('app/core/dbinterface')
const logger = require('app/core/logger')
const queue = require('app/core/managers/queue')

let instance

module.exports = class WebhookManager {
  static getInstance () {
    return instance
  }

  constructor (config) {
    this.config = config

    this.emitter = new EventEmitter()
    this.queue = queue.getInstance().connection('webhooks')

    if (!instance) {
      instance = this
    }

    return instance
  }

  async init () {
    if (!this.config.enabled) return false

    map(this.config.events, 'name').forEach((event) => {
      this.emitter.on(event, async (payload) => {
        const webhooks = await db.getInstance().webhooks.findByEvent(event)

        this
          .getMatchingWebhooks(webhooks, payload)
          .forEach((webhook) => this.queue.add({ webhook: webhook, payload: payload }))
      })
    })

    this.queue.process(async (job) => {
      try {
        const response = await axios.post(job.data.webhook.target, {
          formParams: {
            created: +new Date(),
            data: job.data.payload,
            type: job.data.webhook.event
          },
          headers: { 'X-Hook-Token': job.data.webhook.token }
        })

        return {
          status: response.status,
          headers: response.headers,
          data: response.data
        }
      } catch (error) {
        logger.error(`Job ${job.id} failed! ${error.message}`)
      }
    })

    this.queue.on('completed', (job, result) => {
      logger.debug(`Job ${job.id} completed! Event [${job.data.webhook.event}] has been transmitted to [${job.data.webhook.target}] with a status of [${result.status}].`)

      job.remove()
    })
  }

  emit (event, payload) {
    this.emitter.emit(event, payload)
  }

  getMatchingWebhooks (webhooks, payload) {
    const matches = []

    webhooks.forEach((webhook) => {
      if (!webhook.conditions) webhooks.push(webhook)

      for (let condition of webhook.conditions) {
        const satisfies = require(`app/webhooks/conditions/${condition.condition}`)

        if (!satisfies(payload[condition.key], condition.value)) break

        matches.push(webhook)
      }
    })

    return matches
  }
}
