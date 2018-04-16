const db = require('@arkecosystem/core-module-loader').get('database').getInstance()
const utils = require('../utils')
const schema = require('../schema/delegates')

exports.index = {
  handler: async (request, h) => {
    const delegates = await db.delegates.paginate(utils.paginate(request))

    return utils.toPagination(request, delegates, 'delegate')
  },
  options: {
    validate: schema.index
  }
}

exports.show = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.params.id)

    return utils.respondWithResource(request, delegate, 'delegate')
  },
  options: {
    validate: schema.show
  }
}

exports.blocks = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.params.id)
    const blocks = await db.blocks.findAllByGenerator(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.blocks
  }
}

exports.voters = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.params.id)
    const wallets = await db.wallets.findAllByVote(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  },
  options: {
    validate: schema.voters
  }
}
