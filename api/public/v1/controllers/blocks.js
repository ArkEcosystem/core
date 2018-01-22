const blockchain = requireFrom('core/blockchainManager').getInstance()
const db = requireFrom('core/dbinterface').getInstance()
const config = requireFrom('core/config')
const helpers = require('../helpers')

class BlocksController {
  index (req, res, next) {
    db.blocks
      .all(req.query)
      .then(result => helpers.toCollection(result.rows, 'block'))
      .then(blocks => helpers.respondWith('ok', {blocks}))
  }

  show (req, res, next) {
    db.blocks.findById(req.query.id)
      .then(block => {
        if (!block) return helpers.respondWith('error', `Block with id ${req.query.id} not found`)

        helpers.respondWith('ok', { block: helpers.toResource(block, 'block') })
      })
  }

  epoch (req, res, next) {
    helpers.respondWith('ok', {
      epoch: config.getConstants(blockchain.status.lastBlock.data.height).epoch
    })
  }

  height (req, res, next) {
    const block = blockchain.status.lastBlock.data

    helpers.respondWith('ok', { height: block.height, id: block.id })
  }

  nethash (req, res, next) {
    helpers.respondWith('ok', { nethash: config.network.nethash })
  }

  fee (req, res, next) {
    helpers.respondWith('ok', {
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.send
    })
  }

  fees (req, res, next) {
    helpers.respondWith('ok', {
      fees: config.getConstants(blockchain.status.lastBlock.data.height).fees
    })
  }

  milestone (req, res, next) {
    helpers.respondWith('ok', {
      milestone: ~~(blockchain.status.lastBlock.data.height / 3000000)
    })
  }

  reward (req, res, next) {
    helpers.respondWith('ok', {
      reward: config.getConstants(blockchain.status.lastBlock.data.height).reward
    })
  }

  supply (req, res, next) {
    const lastblock = blockchain.status.lastBlock.data

    helpers.respondWith('ok', {
      supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })
  }

  status (req, res, next) {
    const lastblock = blockchain.status.lastBlock.data

    helpers.respondWith('ok', {
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
