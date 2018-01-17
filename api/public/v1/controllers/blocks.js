const blockchain = requireFrom('core/blockchainManager')
const db = requireFrom('core/dbinterface').getInstance()
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const helpers = require('../helpers')

class BlocksController {
  index (req, res, next) {
    db.blocks.all(req.query)
      .then(result => {
        helpers.respondWith('ok', {
          blocks: helpers.toCollection(result.rows, 'block')
        })
      })
      .catch(error => {
        logger.error(error)

        helpers.respondWith('error', {
          error: error
        })
      })
  }

  show (req, res, next) {
    db.blocks.findById(req.query.id)
      .then(result => {
        if (!result) {
          helpers.respondWith('error', {
            error: `Block with id ${req.query.id} not found`
          })
        } else {
          helpers.respondWith('ok', {
            block: helpers.toResource(result, 'block')
          })
        }
      })
      .catch(error => {
        logger.error(error)
        helpers.respondWith('error', {
          error: error
        })
      })
  }

  epoch (req, res, next) {
    helpers.respondWith('ok', {
      epoch: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).epoch
    })
  }

  height (req, res, next) {
    const block = blockchain.getInstance().status.lastBlock.data

    helpers.respondWith('ok', {
      height: block.height,
      id: block.id
    })
  }

  nethash (req, res, next) {
    helpers.respondWith('ok', {
      nethash: config.network.nethash
    })
  }

  fee (req, res, next) {
    helpers.respondWith('ok', {
      fee: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.send
    })
  }

  fees (req, res, next) {
    helpers.respondWith('ok', {
      fees: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees
    })
  }

  milestone (req, res, next) {
    helpers.respondWith('ok', {
      milestone: ~~(blockchain.getInstance().status.lastBlock.data.height / 3000000)
    })
  }

  reward (req, res, next) {
    helpers.respondWith('ok', {
      reward: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).reward
    })
  }

  supply (req, res, next) {
    const lastblock = blockchain.getInstance().status.lastBlock.data

    helpers.respondWith('ok', {
      supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })
  }

  status (req, res, next) {
    const lastblock = blockchain.getInstance().status.lastBlock.data

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
