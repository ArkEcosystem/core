'use strict';

const { models } = require('@arkecosystem/client')

module.exports = async (data) => {
  const transform = await data.reduce((acc, value, key) => {
    const serialized = Buffer.from(value.dataValues.serialized).toString('hex')
    const tx = models.Transaction.deserialize(serialized)
    acc.push(tx)
    return acc
  }, [])
  return transform
}
