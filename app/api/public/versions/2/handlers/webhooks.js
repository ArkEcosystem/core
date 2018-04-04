const db = require('../../../../../core/dbinterface').getInstance()
const config = require('../../../../../core/config')
const utils = require('../utils')
const schema = require('../schema/webhooks')

exports.index = {
  handler: async (request, h) => {
    const webhooks = await db.webhooks.paginate(utils.paginate(request))

    return utils.toPagination(request, webhooks, 'webhook')
  },
  options: {
    auth: 'webhooks'
  }
}

exports.store = {
  handler: async (request, h) => {
    const secret = require('crypto').randomBytes(32).toString('hex')
    request.payload.secret = secret.substring(0, 32) // We only store the first 32 chars

    const webhook = await db.webhooks.create(request.payload)
    webhook.secret = secret // We show the full secret once on creation

    return h.response(utils.respondWithResource(request, webhook, 'webhook')).code(201)
  },
  options: {
    auth: 'webhooks',
    plugins: {
      pagination: {
        enabled: false
      }
    },
    validate: schema.store
  }
}

exports.show = {
  handler: async (request, h) => {
    const webhook = await db.webhooks.findById(request.params.id)

    return utils.respondWithResource(request, webhook, 'webhook')
  },
  options: {
    auth: 'webhooks',
    validate: schema.show
  }
}

exports.update = {
  handler: async (request, h) => {
    await db.webhooks.update(request.params.id, request.payload)

    return h.response(null).code(204)
  },
  options: {
    auth: 'webhooks',
    validate: schema.update
  }
}

exports.destroy = {
  handler: async (request, h) => {
    await db.webhooks.destroy(request.params.id, request.payload)

    return h.response(null).code(204)
  },
  options: {
    auth: 'webhooks',
    validate: schema.destroy
  }
}

exports.events = {
  handler: (request, h) => {
    return {
      data: config.webhooks.events
    }
  },
  options: {
    auth: 'webhooks'
  }
}
