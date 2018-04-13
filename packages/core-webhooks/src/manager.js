const axios = require('axios')
const map = require('lodash/map')
const EventEmitter = require('events').EventEmitter
const logger = require('@arkecosystem/core-logger')
const database = require('@arkecosystem/core-database')
const queue = require('./queue')

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
    if (!this.config.enabled) return

    map(this.config.events, 'name').forEach((event) => {
      this.emitter.on(event, async (payload) => {
        const webhooks = await database.getInstance().webhooks.findByEvent(event)

        this
          .getMatchingWebhooks(webhooks, payload)
          .forEach((webhook) => this.queue.add({ webhook: webhook, payload: payload }))
      })
    })

    this.queue.process(async (job) => {
      try {
        const response = await axios.post(job.data.webhook.target, {
          formParams: {
            timestamp: +new Date(),
            data: job.data.payload,
            event: job.data.webhook.event
          },
          headers: { 'Authorization': job.data.webhook.token }
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
    if (!this.config.enabled) return

    this.emitter.emit(event, payload)
  }

  getMatchingWebhooks (webhooks, payload) {
    const matches = []

    webhooks.forEach((webhook) => {
      if (!webhook.conditions) webhooks.push(webhook)

      for (let condition of webhook.conditions) {
        const satisfies = require(`../../webhooks/conditions/${condition.condition}`)

        if (!satisfies(payload[condition.key], condition.value)) break

        matches.push(webhook)
      }
    })

    return matches
  }
}
