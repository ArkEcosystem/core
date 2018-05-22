'use strict'

const _ = require('lodash')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const database = container.resolvePlugin('database')
const blockchain = container.resolvePlugin('blockchain')

const schema = require('../schema/statistics')

/**
 * @type {Object}
 */
exports.blockchain = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const lastBlock = blockchain.getLastBlock(true)

    const height = lastBlock.height
    const initialSupply = config.genesisBlock.totalAmount / 10 ** 8

    const constants = config.getConstants(height)
    const rewardPerBlock = constants.reward / 10 ** 8

    const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

    let delegates = database.delegates.getActiveAtHeight(height, totalSupply)
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

/**
 * @type {Object}
 */
exports.transactions = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transactions = await database.transactions.findAllByDateAndType(TRANSACTION_TYPES.TRANSFER, request.query.from, request.query.to)

    return {
      data: {
        count: transactions.length,
        amount: _.sumBy(transactions, 'amount'),
        fees: _.sumBy(transactions, 'fee')
      }
    }
  },
  options: {
    validate: schema.transactions
  }
}

/**
 * @type {Object}
 */
exports.blocks = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const blocks = await database.blocks.findAllByDateTimeRange(request.query.from, request.query.to)

    return {
      data: {
        count: blocks.length,
        rewards: _.sumBy(blocks, 'reward'),
        fees: _.sumBy(blocks, 'totalFee')
      }
    }
  },
  options: {
    validate: schema.blocks
  }
}

/**
 * @type {Object}
 */
exports.votes = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    let transactions = await database.transactions.findAllByDateAndType(TRANSACTION_TYPES.VOTE, request.query.from, request.query.to)
    transactions = transactions.filter(transaction => transaction.asset.votes[0].startsWith('+'))

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

/**
 * @type {Object}
 */
exports.unvotes = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    let transactions = await database.transactions.findAllByDateAndType(TRANSACTION_TYPES.VOTE, request.query.from, request.query.to)
    transactions = transactions.filter(transaction => transaction.asset.votes[0].startsWith('-'))

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
