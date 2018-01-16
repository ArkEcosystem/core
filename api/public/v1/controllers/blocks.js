const blockchain = requireFrom('core/blockchainManager')
const db = requireFrom('core/dbinterface').getInstance()
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const logger = requireFrom('core/logger')

class BlocksController {
  index (req, res, next) {
    db.blocks.all(req.query)
      .then(result => {
        responder.ok(req, res, {
          blocks: new Transformer(req).collection(result.rows, 'block')
        })
      })
      .catch(error => {
        logger.error(error)

        responder.error(req, res, {
          error: error
        })
      })

    next()
  }

  show (req, res, next) {
    db.blocks.findById(req.query.id)
      .then(result => {
        if (!result) {
          responder.error(req, res, {
            error: `Block with id ${req.query.id} not found`
          })
        } else {
          responder.ok(req, res, {
            block: new Transformer(req).resource(result, 'block')
          })
        }
      })
      .catch(error => {
        logger.error(error)
        responder.error(req, res, {
          error: error
        })
      })

    next()
  }

  epoch (req, res, next) {
    responder.ok(req, res, {
      epoch: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).epoch
    })

    next()
  }

  height (req, res, next) {
    let block = blockchain.getInstance().status.lastBlock.data

    responder.ok(req, res, {
      height: block.height,
      id: block.id
    })

    next()
  }

  nethash (req, res, next) {
    responder.ok(req, res, {
      nethash: config.network.nethash
    })

    next()
  }

  fee (req, res, next) {
    responder.ok(req, res, {
      fee: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.send
    })

    next()
  }

  fees (req, res, next) {
    responder.ok(req, res, {
      fees: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees
    })

    next()
  }

  milestone (req, res, next) {
    responder.ok(req, res, {
      milestone: ~~(blockchain.getInstance().status.lastBlock.data.height / 3000000)
    })

    next()
  }

  reward (req, res, next) {
    responder.ok(req, res, {
      reward: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).reward
    })

    next()
  }

  supply (req, res, next) {
    let lastblock = blockchain.getInstance().status.lastBlock.data
    responder.ok(req, res, {
      supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })

    next()
  }

  status (req, res, next) {
    let lastblock = blockchain.getInstance().status.lastBlock.data

    responder.ok(req, res, {
       epoch: config.getConstants(lastblock.height).epoch,
       height: lastblock.height,
       fee: config.getConstants(lastblock.height).fees.send,
       milestone: ~~(lastblock.height / 3000000),
       nethash: config.network.nethash,
       reward: config.getConstants(lastblock.height).reward,
       supply: config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
     })

    next()
  }
}

module.exports = new BlocksController()
