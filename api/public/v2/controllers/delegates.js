const db = requireFrom('core/dbinterface').getInstance()
const utils = require('../utils')

const index = (req, res, next) => {
  db.delegates
    .paginate(utils.paginator(req))
    .then(delegates => utils.respondWithPagination(req, res, delegates, 'delegate'))
    .then(() => next())
}

const show = (req, res, next) => {
  db.delegates
    .findById(req.params.id)
    .then(delegate => utils.respondWithResource(req, res, delegate, 'delegate'))
    .then(() => next())
}

const blocks = (req, res, next) => {
  db.delegates
    .findById(req.params.id)
    .then(delegate => db.blocks.findAllByGenerator(delegate.publicKey, utils.paginator(req)))
    .then(blocks => utils.respondWithPagination(req, res, blocks, 'block'))
    .then(() => next())
}

const voters = (req, res, next) => {
  db.delegates
    .findById(req.params.id)
    .then(delegate => db.wallets.findAllByVote(delegate.publicKey))
    .then(wallets => utils.respondWithCollection(req, res, wallets, 'wallet'))
    .then(() => next())
}

module.exports = {
  index,
  show,
  blocks,
  voters,
}
