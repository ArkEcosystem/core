/* eslint no-await-in-loop: "off" */

const axios = require('axios')
const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')
const database = require('./database')

const emitter = app.resolvePlugin('event-emitter')

class WebhookManager {
  /**
   * Set up the webhook app.
   * @param  {Object} config
   * @return {void}
   */
  async setUp(config) {
    this.config = config

    for (const event of app.resolvePlugin('blockchain').getEvents()) {
      emitter.on(event, async payload => {
        const webhooks = await database.findByEvent(event)

        for (const webhook of this.getMatchingWebhooks(webhooks, payload)) {
          try {
            const response = await axios.post(
              webhook.target,
              {
                timestamp: +new Date(),
                data: payload,
                event: webhook.event,
              },
              {
                headers: {
                  Authorization: webhook.token,
                },
              },
            )

            logger.debug(
              `Webhooks Job ${webhook.id} completed! Event [${
                webhook.event
              }] has been transmitted to [${
                webhook.target
              }] with a status of [${response.status}].`,
            )
          } catch (error) {
            logger.error(`Webhooks Job ${webhook.id} failed: ${error.message}`)
          }
        }
      })
    }
  }

  /**
   * Get all webhooks.
   * @param  {Array} webhooks
   * @param  {Object} payload
   * @return {Array}
   */
  getMatchingWebhooks(webhooks, payload) {
    const matches = []

    for (const webhook of webhooks) {
      if (!webhook.enabled) {
        continue
      }

      if (!webhook.conditions) {
        matches.push(webhook)

        continue
      }

      for (const condition of webhook.conditions) {
        const satisfies = require(`./conditions/${condition.condition}`)

        if (!satisfies(payload[condition.key], condition.value)) {
          continue
        }

        matches.push(webhook)
      }
    }

    return matches
  }
}

module.exports = new WebhookManager()
