const db = require('core/dbinterface').getInstance()
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return db.delegates
      .paginate(utils.paginate(request))
      .then(delegates => h.response({
        results: utils.toCollection(request, delegates.rows, 'delegate'),
        totalCount: delegates.count
      }))
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
      .then(blocks => h.response({
        results: utils.toCollection(request, blocks.rows, 'block'),
        totalCount: blocks.count
      }))
  }
}

exports.voters = {
  handler: (request, h) => {
    return db.delegates
      .findById(request.params.id)
      .then(delegate => db.wallets.findAllByVote(delegate.publicKey))
      .then(wallets => h.response({
        results: utils.toCollection(request, wallets, 'wallet'),
        totalCount: wallets.length
      }))
  }
}
