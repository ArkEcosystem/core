const db = require('app/core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.delegates
      .paginate(utils.paginate(request))
      .then(delegates => utils.toPagination(request, delegates, 'delegate'))
  }
}

exports.show = {
  handler: (request, h) => {
    return db.delegates
      .findById(request.params.id)
      .then(delegate => utils.respondWithResource(request, delegate, 'delegate'))
  }
}

exports.blocks = {
  handler: (request, h) => {
    return db.delegates
      .findById(request.params.id)
      .then(delegate => db.blocks.findAllByGenerator(delegate.publicKey, utils.paginate(request)))
      .then(blocks => utils.toPagination(request, blocks, 'block'))
  }
}

exports.voters = {
  handler: (request, h) => {
    return db.delegates
      .findById(request.params.id)
      .then(delegate => db.wallets.findAllByVote(delegate.publicKey))
      .then(wallets => utils.toPagination(request, wallets, 'wallet'))
  }
}
