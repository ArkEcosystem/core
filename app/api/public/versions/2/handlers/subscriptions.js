const Boom = require('boom')
const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.webhooks
      .paginate(utils.paginate(request))
      .then(webhooks => utils.toPagination(request, webhooks, 'webhook'))
  }
}

exports.store = {
  handler: (request, h) => {
    return db.webhooks
      .create(request.payload)
      .then(webhook => utils.respondWithResource(request, webhook, 'webhook'))
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
      .then(webhook => {})
  }
}

exports.events = {
  handler: (request, h) => {
    return { data: 'events' }
  }
}
