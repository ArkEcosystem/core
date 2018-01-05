const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const responder = requireFrom('api/responder')
const blocks = requireFrom('repositories/blocks')
const transformer = requireFrom('api/transformer')
const logger = requireFrom('core/logger')

class BlocksController {
  index(req, res, next) {

    var whereStatement = {}
    var orderBy = []

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
    for (const elem of filter) {
      if (!!req.query[elem])
        whereStatement[elem] = req.query[elem]
    }

    if (!!req.query.orderBy){
      orderBy.push(req.query.orderBy.split(':'))
    }

    blocks.all({
      where: whereStatement,
      order: orderBy,
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100)})
      .then(result => {
        responder.ok(req, res, {
          blocks: new transformer(req).collection(result.rows, 'block')
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

  show(req, res, next) {
    blocks.findById(req.query.id)
      .then(result => {
        if (!result) {
          responder.resourceNotFound(res, `Block with id ${req.query.id} not found`);
        } else {
          responder.ok(req, res, {
            blocks: new transformer(req).resource(result, 'block')
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

  epoch(req, res, next) {
    responder.ok(req,res,{
      epoch: config.getConstants(blockchain.getInstance().lastBlock.data.height).epoch
    })

    next()
  }

  height(req, res, next) {
    let block = blockchain.getInstance().lastBlock.data

    responder.ok(req,res,{
      height: block.height,
      id: block.id
    })

    next()
  }

  nethash(req, res, next) {
    responder.ok(req,res,{
      nethash: config.network.nethash
    })

    next()
  }

  fee(req, res, next) {
    responder.ok(req,res,{
      fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.send
    })

    next()
  }

  fees(req, res, next) {
    responder.ok(req,res,{
      fees: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees
    })

    next()
  }

  milestone(req, res, next) {
    responder.ok(req,res,{
      milestone: ~~(blockchain.getInstance().lastBlock.data.height / 3000000)
    })

    next()
  }

  reward(req, res, next) {
    responder.ok(req,res,{
      reward: config.getConstants(blockchain.getInstance().lastBlock.data.height).reward
    })

    next()
  }

  supply(req, res, next) {
    let lastblock = blockchain.getInstance().lastBlock.data
    responder.ok(req,res,{
      supply: config.genesisBlock.totalAmount +  (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
    })

    next()
  }

  status(req, res, next) {
     let lastblock = blockchain.getInstance().lastBlock.data

    responder.ok(req,res,{
       epoch: config.getConstants(lastblock.height).epoch,
       height: lastblock.height,
       fee: config.getConstants(lastblock.height).fees.send,
       milestone: ~~(lastblock.height / 3000000),
       nethash: config.network.nethash,
       reward: config.getConstants(lastblock.height).reward,
       supply: config.genesisBlock.totalAmount +  (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
     })

    next()
  }

}

module.exports = new BlocksController()
