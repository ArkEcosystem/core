const Joi = require('joi')
const { utils } = require('@arkecosystem/crypto')
const database = require('../../../services/database')

module.exports = {
  name: 'accounts.bip38.info',
  async method (params) {
    const wif = await database.get(utils.sha256(Buffer.from(params.userId)).toString('hex'))

    return { wif }
  },
  schema: {
    userId: Joi.string().hex().required()
  }
}
