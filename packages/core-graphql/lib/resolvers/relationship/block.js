'use strict';

const database = require('@arkecosystem/core-container').resolvePlugin('database')
const { models } = require('@arkecosystem/client')
const { formatOrderBy } = require('../../helpers')

module.exports = {
  transactions: async (block, args) => {
    const { orderBy, filter, ...params } = args

    const order = formatOrderBy(orderBy, 'timestamp:DESC')
    const result = await database.transactions.findAll({ ...filter, orderBy: order, ...params }, false)
    const transform = await result.reduce((acc, value, key) => {
      const serialized = Buffer.from(value.dataValues.serialized).toString('hex')
      const tx = models.Transaction.deserialize(serialized)
      console.log(tx)
      acc.push(tx)
      return acc
    }, [])
    return transform
  },
  generator: (block) => {
    const generatorPublicKey = block.dataValues.generatorPublicKey
    return database.wallets.findById(generatorPublicKey)
  }
}
