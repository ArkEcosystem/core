const blockchain = requireFrom('core/blockchainManager').getInstance()
const db = requireFrom('core/dbinterface').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

class BlocksController {
  index (req, res, next) {
    db.blocks
      .findAll(Object.assign(req.query, utils.paginator()))
      .then(result => utils.toCollection(result.rows, 'block'))
      .then(blocks => utils.respondWith('ok', {blocks}))
  }

  show (req, res, next) {
    db.blocks.findById(req.query.id)
      .then(block => {
        if (!block) return utils.respondWith('error', `Block with id ${req.query.id} not found`)

        utils.respondWith('ok', { block: utils.toResource(block, 'block') })
      })
  }

  epoch (req, res, next) {
    utils.respondWith('ok', {
      epoch: config.getConstants(blockchain.status.lastBlock.data.height).epoch
    })
  }

  height (req, res, next) {
    const block = blockchain.status.lastBlock.data

    utils.respondWith('ok', { height: block.height, id: block.id })
  }

  nethash (req, res, next) {
    utils.respondWith('ok', { nethash: config.network.nethash })
  }

  fee (req, res, next) {
    utils.respondWith('ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.send
    })
  }

  fees (req, res, next) {
    utils.respondWith('ok', {
      fees: config.getConstants(blockchain.status.lastBlock.data.height).fees
    })
  }

  milestone (req, res, next) {
    utils.respondWith('ok', {
      milestone: ~~(blockchain.status.lastBlock.data.height / 3000000)
    })
  }

  reward (req, res, next) {
    utils.respondWith('ok', {
      reward: config.getConstants(blockchain.status.lastBlock.data.height).reward
    })
  }

  supply (req, res, next) {
    const lastblock = blockchain.status.lastBlock.data

    utils.respondWith('ok', {
      supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })
  }

  status (req, res, next) {
    const lastblock = blockchain.status.lastBlock.data

    utils.respondWith('ok', {
       epoch: config.getConstants(lastblock.height).epoch,
       height: lastblock.height,
       fee: config.getConstants(lastblock.height).fees.send,
       milestone: ~~(lastblock.height / 3000000),
       nethash: config.network.nethash,
       reward: config.getConstants(lastblock.height).reward,
       supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
     })
  }
}

module.exports = new BlocksController()
