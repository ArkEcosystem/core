const Boom = require('boom')
const Joi = require('joi')
const { utils } = require('@arkecosystem/crypto')
const database = require('../../../services/database')

module.exports = {
  name: 'wallets.bip38.info',
  async method (params) {
    const wif = await database.get(utils.sha256(Buffer.from(params.userId)).toString('hex'))

    return wif
      ? { wif }
      : Boom.notFound(`User ${params.userId} could not be found.`)
  },
  schema: {
    userId: Joi.string().hex().required()
  }
}
