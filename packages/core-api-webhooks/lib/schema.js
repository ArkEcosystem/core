'use strict'

const webhookManager = require('@arkecosystem/core-plugin-manager').get('webhooks')
const Joi = require('joi')

/**
 * TODO: refactor this to simple exports.*
 */
class Schema {
  /**
   * Initialise the schema.
   * @return {void}
   */
  init () {
    this.events = webhookManager.getEvents().map(event => event.name)
    this.conditions = [
      'between', 'contains', 'eq', 'falsy', 'gt', 'gte',
      'lt', 'lte', 'ne', 'not-between', 'regexp', 'truthy'
    ]
  }

  /**
   * @return {Object}
   */
  index () {
    return {
      query: {
        page: Joi.number().integer(),
        limit: Joi.number().integer()
      }
    }
  }

  /**
   * @return {Object}
   */
  show () {
    return {
      params: {
        id: Joi.string()
      }
    }
  }

  /**
   * @return {Object}
   */
  store () {
    return {
      payload: {
        event: Joi.string().valid(this.events).required(),
        target: Joi.string().required().uri(),
        enabled: Joi.boolean().default(true),
        conditions: Joi.array().items(Joi.object({
          key: Joi.string(),
          value: Joi.string(),
          condition: Joi.string().valid(this.conditions)
        }))
      }
    }
  }

  /**
   * @return {Object}
   */
  update () {
    return {
      payload: {
        event: Joi.string().valid(this.events),
        target: Joi.string().uri(),
        enabled: Joi.boolean(),
        conditions: Joi.array().items(Joi.object({
          key: Joi.string(),
          value: Joi.string(),
          condition: Joi.string().valid(this.conditions)
        }))
      }
    }
  }

  /**
   * @return {Object}
   */
  destroy () {
    return {
      params: {
        id: Joi.string()
      }
    }
  }
}

/**
 * @type {Schema}
 */
module.exports = new Schema()
