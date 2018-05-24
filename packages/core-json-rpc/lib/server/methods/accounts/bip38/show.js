const Joi = require('joi')
const ark = require('@arkecosystem/crypto')
const database = require('../../../services/database')

module.exports = {
  name: 'accounts.bip38.info',
  async method (params) {
    const wif = await database.getUTF8(ark.crypto.sha256(Buffer.from(params.userId)).toString('hex'))

    return { wif }
  },
  schema: {
    userId: Joi.string().hex().required()
  }
}
