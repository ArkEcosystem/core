'use strict'

const axios = require('axios')
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

    map(this.config.events, 'name').forEach(event => {
      emitter.on(event, async payload => {
        let webhooks = await database.findByEvent(event)
        webhooks = this.getMatchingWebhooks(webhooks, payload)

        for (let i = 0; i < webhooks.length; i++) {
          const webhook = webhooks[i]
          try {
            const response = await axios.post(webhook.data.webhook.target, {
              timestamp: +new Date(),
              data: webhook.data.payload,
              event: webhook.data.webhook.event
            }, {
              headers: {
                Authorization: webhook.data.webhook.token
              }
            })

            logger.debug(`Webhooks Job ${webhook.id} completed! Event [${webhook.data.webhook.event}] has been transmitted to [${webhook.data.webhook.target}] with a status of [${response.status}].`)
          } catch (error) {
            logger.error(`Webhooks Job ${webhook.id} failed: ${error.message}`)
          }
        }
      })
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
}

module.exports = new WebhookManager()
