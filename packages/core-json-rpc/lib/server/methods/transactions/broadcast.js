const Boom = require('boom')
const Joi = require('joi')
const { crypto } = require('@arkecosystem/crypto')
const network = require('../../services/network')
const database = require('../../services/database')

module.exports = {
  name: 'transactions.broadcast',
  async method (params) {
    const transaction = await database.get(params.id)

    if (!transaction) {
      return Boom.notFound(`Transaction ${params.id} could not be found.`)
    }

    if (!crypto.verify(transaction)) {
      return Boom.badData()
    }

    await network.broadcast(transaction)

    return transaction
  },
  schema: {
    id: Joi.string().length(64)
  }
}
