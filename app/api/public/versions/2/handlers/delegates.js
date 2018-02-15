const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: async (request, h) => {
    const delegates = await db.delegates.paginate(utils.paginate(request))

    return utils.toPagination(request, delegates, 'delegate')
  }
}

exports.show = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.params.id)

    return utils.respondWithResource(request, delegate, 'delegate')
  }
}

exports.blocks = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.params.id)
    const blocks = await db.blocks.findAllByGenerator(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  }
}

exports.voters = {
  handler: async (request, h) => {
    const delegate = await db.delegates.findById(request.params.id)
    const wallets = await db.wallets.findAllByVote(delegate.publicKey, utils.paginate(request))

    return utils.toPagination(request, wallets, 'wallet')
  }
}
