const Joi = require('joi')
const db = require('app/core/dbinterface').getInstance()
const config = require('app/core/config')
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.webhooks
      .paginate(utils.paginate(request))
      .then(webhooks => utils.toPagination(request, webhooks, 'webhook'))
  }
}

exports.store = {
  config: {
    validate: {
      payload: {
        event: Joi.string(),
        enabled: Joi.boolean(),
        options: Joi.object()
      }
    }
  },
  handler: (request, h) => {
    return db.webhooks
      .create(request.payload)
      .then(webhook => utils.respondWithResource(request, webhook, 'webhook'))
      .then(response => h.response(response).code(201))
  }
}

exports.show = {
handler: (request, h) => {
  return db.webhooks
    .findById(request.params.id)
    .then(webhook => utils.respondWithResource(request, webhook, 'webhook'))
  }
}

exports.update = {
  config: {
    validate: {
      payload: {
        event: Joi.string(),
        enabled: Joi.boolean(),
        options: Joi.object()
      }
    }
  },
  handler: (request, h) => {
    return db.webhooks
      .update(request.params.id, request.payload)
      .then(webhook => utils.respondWithResource(request, webhook, 'webhook'))
  }
}

exports.destroy = {
  handler: (request, h) => {
    return db.webhooks
      .destroy(request.params.id, request.payload)
      .then(() => h.response(null).code(204))
  }
}

exports.events = {
  handler: (request, h) => {
    return { data: config.webhooks.events }
  }
}
