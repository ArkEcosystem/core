const blockchain = requireFrom('core/blockchainManager').getInstance()
const db = requireFrom('core/dbinterface').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

class BlocksController {
  index (req, res, next) {
    db.blocks
      .findAll({...req.query, ...utils.paginator()})
      .then(result => utils.toCollection(result.rows, 'block'))
      .then(blocks => utils.respondWith('ok', {blocks}))
      .then(() => next())
  }

  show (req, res, next) {
    db.blocks.findById(req.query.id)
      .then(block => {
        if (!block) return utils.respondWith('error', `Block with id ${req.query.id} not found`)

        return utils.respondWith('ok', { block: utils.toResource(block, 'block') })
      })
      .then(() => next())
  }

  epoch (req, res, next) {
    utils
      .respondWith('ok', {
        epoch: config.getConstants(blockchain.status.lastBlock.data.height).epoch
      })
      .then(() => next())
  }

  height (req, res, next) {
    const block = blockchain.status.lastBlock.data

    utils
      .respondWith('ok', { height: block.height, id: block.id })
      .then(() => next())
  }

  nethash (req, res, next) {
    utils
      .respondWith('ok', { nethash: config.network.nethash })
      .then(() => next())
  }

  fee (req, res, next) {
    utils
      .respondWith('ok', {
        fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.send
      })
      .then(() => next())
  }

  fees (req, res, next) {
    utils
      .respondWith('ok', {
        fees: config.getConstants(blockchain.status.lastBlock.data.height).fees
      })
      .then(() => next())
  }

  milestone (req, res, next) {
    utils
      .respondWith('ok', {
        milestone: ~~(blockchain.status.lastBlock.data.height / 3000000)
      })
      .then(() => next())
  }

  reward (req, res, next) {
    utils
      .respondWith('ok', {
        reward: config.getConstants(blockchain.status.lastBlock.data.height).reward
      })
      .then(() => next())
  }

  supply (req, res, next) {
    const lastblock = blockchain.status.lastBlock.data

    utils
      .respondWith('ok', {
        supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
      })
      .then(() => next())
  }

  status (req, res, next) {
    const lastblock = blockchain.status.lastBlock.data

    utils
      .respondWith('ok', {
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
}

module.exports = new BlocksController()
