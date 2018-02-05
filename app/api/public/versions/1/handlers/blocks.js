const blockchain = require('app/core/blockchainManager').getInstance()
const db = require('app/core/dbinterface').getInstance()
const config = require('app/core/config')
const utils = require('../utils')
const schema = require('../schemas/blocks')

exports.index = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlocks
      }
    }
  },
  handler: (request, h) => {
    return db.blocks
      .findAll({...request.query, ...utils.paginator(request)})
      .then(blocks => utils.toCollection(request, blocks.rows, 'block'))
      .then(blocks => utils.respondWith({blocks}))
  }
}

exports.show = {
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getBlock
      }
    }
  },
  handler: (request, h) => {
    return db.blocks.findById(request.query.id).then(block => {
      if (!block) return utils.respondWith(`Block with id ${request.query.id} not found`, true)

      return utils
        .toResource(request, block, 'block')
        .then(block => utils.respondWith({block}))
    })
  }
}

exports.epoch = {
  handler: (request, h) => {
    return utils.respondWith({
      epoch: config.getConstants(blockchain.status.lastBlock.data.height).epoch
    })
  }
}

exports.height = {
  handler: (request, h) => {
    const block = blockchain.status.lastBlock.data

    return utils.respondWith({ height: block.height, id: block.id })
  }
}

exports.nethash = {
  handler: (request, h) => {
    return utils.respondWith({ nethash: config.network.nethash })
  }
}

exports.fee = {
  handler: (request, h) => {
    return utils.respondWith({
      fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.send
    })
  }
}

exports.fees = {
  handler: (request, h) => {
    return utils.respondWith({
      fees: config.getConstants(blockchain.status.lastBlock.data.height).fees
    })
  }
}

exports.milestone = {
  handler: (request, h) => {
    return utils.respondWith({
      milestone: ~~(blockchain.status.lastBlock.data.height / 3000000)
    })
  }
}

exports.reward = {
  handler: (request, h) => {
    return utils.respondWith({
      reward: config.getConstants(blockchain.status.lastBlock.data.height).reward
    })
  }
}

exports.supply = {
  handler: (request, h) => {
    const lastBlock = blockchain.status.lastBlock.data

    return utils.respondWith({
      supply: config.genesisBlock.totalAmount + (lastBlock.height - config.getConstants(lastBlock.height).height) * config.getConstants(lastBlock.height).reward
    })
  }
}

exports.status = {
  handler: (request, h) => {
    const lastBlock = blockchain.status.lastBlock.data

    return utils.respondWith({
      epoch: config.getConstants(lastBlock.height).epoch,
      height: lastBlock.height,
      fee: config.getConstants(lastBlock.height).fees.send,
      milestone: ~~(lastBlock.height / 3000000),
      nethash: config.network.nethash,
      reward: config.getConstants(lastBlock.height).reward,
      supply: config.genesisBlock.totalAmount + (lastBlock.height - config.getConstants(lastBlock.height).height) * config.getConstants(lastBlock.height).reward
    })
  }
}
