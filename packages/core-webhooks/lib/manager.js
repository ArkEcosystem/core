'use strict';

const axios = require('axios')
const map = require('lodash/map')
const EventEmitter = require('events').EventEmitter
const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const database = require('./database')
const RedisQueue = require('./queue')

let instance

module.exports = class WebhookManager {
  /**
   * Create a new webhook manager instance.
   * @return {WebhookManager}
   */
  constructor () {
    if (!instance) {
      instance = this
    }

    return instance
  }

  /**
   * Get a webhook manager instance.
   * @return {WebhookManager}
   */
  static getInstance () {
    return instance
  }

  /**
   * Initialise the webhook manager.
   * @param  {Object} config
   * @return {void}
   */
  async init (config) {
    this.config = config

    if (!this.config.enabled) return

    this.__registerEventEmitter()
    await this.__registerQueueManager()

    map(this.config.events, 'name').forEach((event) => {
      this.emitter.on(event, async (payload) => {
        const webhooks = await database.findByEvent(event)

        this
          .getMatchingWebhooks(webhooks, payload)
          .forEach((webhook) => this.queue.add({
            webhook: webhook,
            payload: payload
          }))
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
          headers: {
            'Authorization': job.data.webhook.token
          }
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

  /**
   * Emit a new webhook event.
   * @param  {String} event
   * @param  {Object} payload
   * @return {void}
   */
  emit (event, payload) {
    if (this.config.enabled) {
      this.emitter.emit(event, payload)
    }
  }

  /**
   * Get all webhooks.
   * @param  {Array} webhooks
   * @param  {Object} payload
   * @return {Array}
   */
  getMatchingWebhooks (webhooks, payload) {
    const matches = []

    webhooks.forEach((webhook) => {
      if (!webhook.conditions) webhooks.push(webhook)

      for (let condition of webhook.conditions) {
        const satisfies = require(`./conditions/${condition.condition}`)

        if (!satisfies(payload[condition.key], condition.value)) break

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
   * Create a new event emitter instance.
   * @return {void}
   */
  __registerEventEmitter () {
    this.emitter = new EventEmitter()
  }

  /**
   * Create a new redis queue instance.
   * @return {void}
   */
  async __registerQueueManager () {
    await new RedisQueue(this.config.redis)

    this.queue = RedisQueue.getInstance().connection('webhooks')
  }
}
