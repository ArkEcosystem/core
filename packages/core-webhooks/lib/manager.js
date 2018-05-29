'use strict'

const axios = require('axios')
const Bull = require('bull')
const map = require('lodash/map')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = require('./database')
const emitter = container.resolvePlugin('event-emitter')

class WebhookManager {
  /**
   * Set up the webhook container.
   * @param  {Object} config
   * @return {void}
   */
  async setUp (config) {
    this.config = config

    await this.__registerQueue()

    map(this.config.events, 'name').forEach(event => {
      emitter.on(event, async payload => {
        const webhooks = await database.findByEvent(event)

        this
          .getMatchingWebhooks(webhooks, payload)
          .forEach(webhook => this.queue.add({ webhook, payload }))
      })
    })

    this.queue.process(async (job) => {
      try {
        const response = await axios.post(job.data.webhook.target, {
          timestamp: +new Date(),
          data: job.data.payload,
          event: job.data.webhook.event
        }, {
          headers: {
            Authorization: job.data.webhook.token
          }
        })

        return {
          status: response.status,
          headers: response.headers,
          data: response.data
        }
      } catch (error) {
        logger.error(`Job ${job.id} failed: ${error.message}`)
      }
    })

    this.queue.on('completed', (job, result) => {
      logger.debug(`Webhooks Job ${job.id} completed! Event [${job.data.webhook.event}] has been transmitted to [${job.data.webhook.target}] with a status of [${result.status}].`)

      job.remove()
    })
  }

  /**
   * Get all webhooks.
   * @param  {Array} webhooks
   * @param  {Object} payload
   * @return {Array}
   */
  getMatchingWebhooks (webhooks, payload) {
    const matches = []

    webhooks.forEach(webhook => {
      if (!webhook.conditions) {
        webhooks.push(webhook)
      }

      for (let condition of webhook.conditions) {
        const satisfies = require(`./conditions/${condition.condition}`)

        if (!satisfies(payload[condition.key], condition.value)) {
          break
        }

        matches.push(webhook)
      }
    })

    return matches
  }

  /**
   * Get all webhook events.
   * @return {Array}
   */
  getEvents () {
    return this.config.events
  }

  /**
   * Create a new redis queue instance.
   * @return {void}
   */
  __registerQueue () {
    this.queue = new Bull('webhooks', { redis: this.config.redis })
  }
}

module.exports = new WebhookManager()
