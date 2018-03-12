const chainInstance = require('app/core/managers/blockchain').getInstance()
const state = chainInstance.getState()
const config = require('app/core/config')
const db = require('app/core/dbinterface').getInstance()
const _ = require('lodash')

exports.blockchain = {
  options: {
    cache: {
      expiresIn: 60 * 1000 * 10
    }
  },
  handler: async (request, h) => {
    const lastBlock = state.lastBlock

    const height = lastBlock.data.height
    const initialSupply = config.genesisBlock.totalAmount / 10 ** 8

    const constants = config.getConstants(height)
    const rewardPerBlock = constants.reward / 10 ** 8

    const totalSupply = config.genesisBlock.totalAmount + (lastBlock.data.height - constants.height) * constants.reward

    let delegates = await db.delegates.active(height, totalSupply)
    delegates = _.sortBy(delegates, 'productivity')

    return h.response({
      data: {
        supply: {
          initial: initialSupply * 10 ** 8,
          current: (initialSupply + ((height - config.getConstants(height).height) * rewardPerBlock)) * 10 ** 8
        },
        blocks: {
          forged: height,
          rewards: height * rewardPerBlock
        },
        rewards: {
          start: constants.height,
          total: height * rewardPerBlock
        },
        productivity: {
          best: delegates[0],
          worst: delegates.reverse()[0]
        }
      }
    })
  }
}

exports.transactions = {
  options: {
    cache: {
      expiresIn: 60 * 1000 * 10
    }
  },
  handler: async (request, h) => {
    const transactions = await db.transactions.findAllByDateAndType(0, request.query.from, request.query.to)

    return {
      data: {
        count: transactions.length,
        amount: _.sumBy(transactions, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }
    }
  }
}

exports.blocks = {
  options: {
    cache: {
      expiresIn: 60 * 1000 * 10
    }
  },
  handler: async (request, h) => {
    const blocks = await db.blocks.findAllByDateTimeRange(request.query.from, request.query.to)

    return {
      data: {
        count: blocks.length,
        rewards: _.sumBy(blocks, 'reward'),
        fees: _.sumBy(blocks, 'totalFee')
      }
    }
  }
}

exports.votes = {
  options: {
    cache: {
      expiresIn: 60 * 1000 * 10
    }
  },
  handler: async (request, h) => {
    let transactions = await db.transactions.findAllByDateAndType(3, request.query.from, request.query.to)
    transactions = transactions.filter(v => v.asset.votes[0].startsWith('+'))

    return {
      data: {
        count: transactions.length,
        amount: _.sumBy(transactions, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }
    }
  }
}

exports.unvotes = {
  options: {
    cache: {
      expiresIn: 60 * 1000 * 10
    }
  },
  handler: async (request, h) => {
    let transactions = await db.transactions.findAllByDateAndType(3, request.query.from, request.query.to)
    transactions = transactions.filter(v => v.asset.votes[0].startsWith('-'))

    return {
      data: {
        count: transactions.length,
        amount: _.sumBy(transactions, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }
    }
  }
}
