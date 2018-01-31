const blockchain = requireFrom('core/blockchainManager').getInstance()
const db = requireFrom('core/dbinterface').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

const index = (req, res, next) => {
  db.blocks
    .findAll({...req.query, ...utils.paginator(req)})
    .then(result => utils.toCollection(req, result.rows, 'block'))
    .then(blocks => utils.respondWith(req, res, 'ok', {blocks}))
    .then(() => next())
}

const show = (req, res, next) => {
  db.blocks.findById(req.query.id)
    .then(block => {
      if (!block) return utils.respondWith(req, res, 'error', `Block with id ${req.query.id} not found`)

      return utils.respondWith(req, res, 'ok', { block: utils.toResource(req, block, 'block') })
    })
    .then(() => next())
}

const epoch = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      epoch: config.getConstants(blockchain.status.lastBlock.data.height).epoch
    })
    .then(() => next())
}

const height = (req, res, next) => {
  const block = blockchain.status.lastBlock.data

  utils
    .respondWith(req, res, 'ok', { height: block.height, id: block.id })
    .then(() => next())
}

const nethash = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', { nethash: config.network.nethash })
    .then(() => next())
}

const fee = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.send
    })
    .then(() => next())
}

const fees = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      fees: config.getConstants(blockchain.status.lastBlock.data.height).fees
    })
    .then(() => next())
}

const milestone = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      milestone: ~~(blockchain.status.lastBlock.data.height / 3000000)
    })
    .then(() => next())
}

const reward = (req, res, next) => {
  utils
    .respondWith(req, res, 'ok', {
      reward: config.getConstants(blockchain.status.lastBlock.data.height).reward
    })
    .then(() => next())
}

const supply = (req, res, next) => {
  const lastblock = blockchain.status.lastBlock.data

  utils
    .respondWith(req, res, 'ok', {
      supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })
    .then(() => next())
}

const status = (req, res, next) => {
  const lastblock = blockchain.status.lastBlock.data

  utils
    .respondWith(req, res, 'ok', {
      epoch: config.getConstants(lastblock.height).epoch,
      height: lastblock.height,
      fee: config.getConstants(lastblock.height).fees.send,
      milestone: ~~(lastblock.height / 3000000),
      nethash: config.network.nethash,
      reward: config.getConstants(lastblock.height).reward,
      supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })
    .then(() => next())
}

module.exports = {
  index,
  show,
  epoch,
  height,
  nethash,
  fee,
  fees,
  milestone,
  reward,
  supply,
  status,
}
