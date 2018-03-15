const db = require('../../../../../core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: async (request, h) => {
    const blocks = await db.blocks.findAll(utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  }
}

exports.show = {
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.params.id)

    return utils.respondWithResource(request, block, 'block')
  }
}

exports.transactions = {
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.params.id)
    const transactions = await db.transactions.findAllByBlock(block.id, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  }
}

exports.search = {
  handler: async (request, h) => {
    const blocks = await db.blocks.search({...request.query, ...utils.paginate(request)})

    return utils.toPagination(request, blocks, 'block')
  }
}
