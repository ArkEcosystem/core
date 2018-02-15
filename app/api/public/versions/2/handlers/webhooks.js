const db = require('app/core/dbinterface').getInstance()
const config = require('app/core/config')
const utils = require('../utils')
const schema = require('../schema/webhooks')

exports.index = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    const webhooks = await db.webhooks.paginate(utils.paginate(request))

    return utils.toPagination(request, webhooks, 'webhook')
  }
}

exports.store = {
  config: {
    auth: 'webhooks',
    validate: {
      payload: schema
    }
  },
  handler: async (request, h) => {
    request.payload.secret = require('crypto').randomBytes(32).toString('hex')

    const webhook = await db.webhooks.create(request.payload)

    return h.response(utils.respondWithResource(request, webhook, 'webhook')).code(201)
  }
}

exports.show = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    const webhook = await db.webhooks.findById(request.params.id)

    return utils.respondWithResource(request, webhook, 'webhook')
  }
}

exports.update = {
  config: {
    auth: 'webhooks',
    validate: {
      payload: schema
    }
  },
  handler: async (request, h) => {
    const webhook = await db.webhooks.update(request.params.id, request.payload)

    return utils.respondWithResource(request, webhook, 'webhook')
  }
}

exports.destroy = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    await db.webhooks.destroy(request.params.id, request.payload)

    h.response(null).code(204)
  }
}

exports.events = {
  config: {
    auth: 'webhooks'
  },
  handler: (request, h) => {
    return { data: config.webhooks.events }
  }
}
