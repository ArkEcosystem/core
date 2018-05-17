'use strict';

const { models } = require('@arkecosystem/client')

module.exports = async (data) => {
  return data.reduce((total, value, key) => {
    const serialized = Buffer.from(value.dataValues.serialized).toString('hex')
    const transaction = models.Transaction.deserialize(serialized)

    total.push(transaction)

    return total
  }, [])
}
