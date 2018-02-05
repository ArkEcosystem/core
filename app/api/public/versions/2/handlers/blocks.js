const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.blocks
      .findAll(utils.paginate(request))
      .then(blocks => utils.toPagination(request, blocks, 'block'))
  }
}

exports.show = {
  handler: (request, h) => {
    return db.blocks
      .findById(request.params.id)
      .then(block => utils.respondWithResource(request, block, 'block'))
  }
}

exports.transactions = {
  handler: (request, h) => {
    return db.blocks
      .findById(request.params.id)
      .then(block => db.transactions.findAllByBlock(block.id, utils.paginate(request)))
      .then(transactions => utils.toPagination(request, transactions, 'transaction'))
  }
}

exports.search = {
  handler: (request, h) => {
    return db.blocks
      .search(request.query)
      .then(blocks => utils.toPagination(request, blocks, 'block'))
  }
}
