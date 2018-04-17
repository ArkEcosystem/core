const webhookManager = require('@arkecosystem/core-pluggy').get('webhooks')
const Joi = require('joi')

class Schema {
  init (config) {
    this.events = webhookManager.getEvents().map(event => event.name)
    this.conditions = [
      'between', 'contains', 'eq', 'falsy', 'gt', 'gte',
      'lt', 'lte', 'ne', 'not-between', 'regexp', 'truthy'
    ]
  }

  index () {
    return {
      query: {
        page: Joi.number().integer(),
        limit: Joi.number().integer()
      }
    }
  }

  show () {
    return {
      params: {
        id: Joi.string()
      }
    }
  }

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

  destroy () {
    return {
      params: {
        id: Joi.string()
      }
    }
  }
}

module.exports = new Schema()
