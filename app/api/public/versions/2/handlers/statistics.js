const Boom = require('boom')
const _ = require('lodash')
const { TRANSACTION_TYPES } = require('../../../../../core/constants')
const chainInstance = require('../../../../../core/managers/blockchain').getInstance()
const state = chainInstance.getState()
const config = require('../../../../../core/config')
const db = require('../../../../../core/dbinterface').getInstance()
const schema = require('../schema/statistics')

exports.blockchain = {
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
  handler: async (request, h) => {
    return Boom.teapot('Temporarily disabled...');

    // const transactions = await db.transactions.findAllByDateAndType(TRANSACTION_TYPES.TRANSFER, request.query.from, request.query.to)

    // return {
    //   data: {
    //     count: transactions.length,
    //     amount: _.sumBy(transactions, 'amount'),
    //     fees: _.sumBy(transactions, 'fee')
    //   }
    // }
  },
  options: {
    validate: schema.transactions
  }
}

exports.blocks = {
  handler: async (request, h) => {
    return Boom.teapot('Temporarily disabled...');

    // const blocks = await db.blocks.findAllByDateTimeRange(request.query.from, request.query.to)

    // return {
    //   data: {
    //     count: blocks.length,
    //     rewards: _.sumBy(blocks, 'reward'),
    //     fees: _.sumBy(blocks, 'totalFee')
    //   }
    // }
  },
  options: {
    validate: schema.blocks
  }
}

exports.votes = {
  handler: async (request, h) => {
    let transactions = await db.transactions.findAllByDateAndType(TRANSACTION_TYPES.VOTE, request.query.from, request.query.to)
    transactions = transactions.filter(v => v.asset.votes[0].startsWith('+'))

    return {
      data: {
        count: transactions.length,
        amount: _.sumBy(transactions, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }
    }
  },
  options: {
    validate: schema.votes
  }
}

exports.unvotes = {
  handler: async (request, h) => {
    let transactions = await db.transactions.findAllByDateAndType(TRANSACTION_TYPES.VOTE, request.query.from, request.query.to)
    transactions = transactions.filter(v => v.asset.votes[0].startsWith('-'))

    return {
      data: {
        count: transactions.length,
        amount: _.sumBy(transactions, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }
    }
  },
  options: {
    validate: schema.unvotes
  }
}
