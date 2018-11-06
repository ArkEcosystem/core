'use strict';

const { Transaction } = require('@arkecosystem/crypto').models

/**
 * Deserialize multiple transactions
 */
module.exports = async (data) => {
  const deserialize = (buffer) => {
    const serialized = Buffer.from(buffer).toString('hex')
    return Transaction.deserialize(serialized)
  }

  if (Array.isArray(data)) {
    return data.reduce((total, value, key) => {
      total.push(deserialize(value.serialized))

      return total
    }, [])
  } else {
    return deserialize(data)
  }
}
