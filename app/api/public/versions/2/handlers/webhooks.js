const db = require('../../../../../core/dbinterface').getInstance()
const config = require('../../../../../core/config')
const utils = require('../utils')
const schema = require('../schema/webhooks')

exports.index = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    const webhooks = await db.webhooks.paginate(utils.paginate(request))

    return utils.toPagination(request, webhooks, 'webhook')
  },
  options: {
    validate: schema.index
  }
}

exports.store = {
  config: {
    auth: 'webhooks',
    plugins: {
      pagination: {
        enabled: false
      }
    }
  },
  handler: async (request, h) => {
    const secret = require('crypto').randomBytes(32).toString('hex')
    request.payload.secret = secret.substring(0, 32) // We only store the first 32 chars

    const webhook = await db.webhooks.create(request.payload)
    webhook.secret = secret // We show the full secret once on creation

    return h.response(utils.respondWithResource(request, webhook, 'webhook')).code(201)
  },
  options: {
    validate: schema.store
  }
}

exports.show = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    const webhook = await db.webhooks.findById(request.params.id)

    return utils.respondWithResource(request, webhook, 'webhook')
  },
  options: {
    validate: schema.show
  }
}

exports.update = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    const webhook = await db.webhooks.update(request.params.id, request.payload)

    return h.response(null).code(204)
  },
  options: {
    validate: schema.update
  }
}

exports.destroy = {
  config: {
    auth: 'webhooks'
  },
  handler: async (request, h) => {
    await db.webhooks.destroy(request.params.id, request.payload)

    return h.response(null).code(204)
  },
  options: {
    validate: schema.destroy
  }
}

exports.events = {
  config: {
    auth: 'webhooks'
  },
  handler: (request, h) => {
    return {
      data: config.webhooks.events
    }
  }
}
