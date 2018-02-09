const db = require('app/core/dbinterface').getInstance()
const config = require('app/core/config')
const utils = require('../utils')
const schema = require('../schema/subscriptions')

exports.index = {
  config: {
    auth: 'subscription'
  },
  handler: (request, h) => {
    return db.webhooks
      .paginate(utils.paginate(request))
      .then(webhooks => utils.toPagination(request, webhooks, 'webhook'))
  }
}

exports.store = {
  config: {
    auth: 'subscription',
    validate: {
      payload: schema
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
  config: {
    auth: 'subscription'
  },
  handler: (request, h) => {
    return db.webhooks
      .findById(request.params.id)
      .then(webhook => utils.respondWithResource(request, webhook, 'webhook'))
  }
}

exports.update = {
  config: {
    auth: 'subscription',
    validate: {
      payload: schema
    }
  },
  handler: (request, h) => {
    return db.webhooks
      .update(request.params.id, request.payload)
      .then(webhook => utils.respondWithResource(request, webhook, 'webhook'))
  }
}

exports.destroy = {
  config: {
    auth: 'subscription'
  },
  handler: (request, h) => {
    return db.webhooks
      .destroy(request.params.id, request.payload)
      .then(() => h.response(null).code(204))
  }
}

exports.events = {
  config: {
    auth: 'subscription'
  },
  handler: (request, h) => {
    return { data: config.webhooks.events }
  }
}
