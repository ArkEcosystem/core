'use strict';

const axios = require('axios')
const map = require('lodash/map')
const EventEmitter = require('events').EventEmitter
const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const database = require('./database')
const RedisQueue = require('./queue')

let instance

module.exports = class Manager {
  /**
   * [getInstance description]
   * @return {[type]} [description]
   */
  static getInstance () {
    return instance
  }

  /**
   * [constructor description]
   * @return {[type]} [description]
   */
  constructor () {
    if (!instance) {
      instance = this
    }

    return instance
  }

  /**
   * [init description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
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
   * [emit description]
   * @param  {[type]} event   [description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  emit (event, payload) {
    if (!this.config.enabled) return

    this.emitter.emit(event, payload)
  }

  /**
   * [getMatchingWebhooks description]
   * @param  {[type]} webhooks [description]
   * @param  {[type]} payload  [description]
   * @return {[type]}          [description]
   */
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

  /**
   * [getEvents description]
   * @return {[type]} [description]
   */
  getEvents () {
    return this.config.events
  }

  /**
   * [__registerEventEmitter description]
   * @return {[type]} [description]
   */
  __registerEventEmitter () {
    this.emitter = new EventEmitter()
  }

  /**
   * [__registerQueueManager description]
   * @return {[type]} [description]
   */
  async __registerQueueManager () {
    await new RedisQueue(this.config.redis)

    this.queue = RedisQueue.getInstance().connection('webhooks')
  }
}
