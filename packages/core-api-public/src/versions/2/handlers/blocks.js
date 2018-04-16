const db = require('@arkecosystem/core-pluggy').get('database')
const utils = require('../utils')
const schema = require('../schema/blocks')

exports.index = {
  handler: async (request, h) => {
    const blocks = await db.blocks.findAll(utils.paginate(request))

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.index
  }
}

exports.show = {
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.params.id)

    return utils.respondWithResource(request, block, 'block')
  },
  options: {
    validate: schema.show
  }
}

exports.transactions = {
  handler: async (request, h) => {
    const block = await db.blocks.findById(request.params.id)
    const transactions = await db.transactions.findAllByBlock(block.id, utils.paginate(request))

    return utils.toPagination(request, transactions, 'transaction')
  },
  options: {
    validate: schema.transactions
  }
}

exports.search = {
  handler: async (request, h) => {
    const blocks = await db.blocks.search({
      ...request.payload,
      ...request.query,
      ...utils.paginate(request)
    })

    return utils.toPagination(request, blocks, 'block')
  },
  options: {
    validate: schema.search
  }
}
