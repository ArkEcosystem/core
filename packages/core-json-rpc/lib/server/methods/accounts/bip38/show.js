const Joi = require('joi')
const ark = require('@arkecosystem/client')
const database = require('../../../services/database')

module.exports = {
  name: 'accounts.bip38.info',
  method: async (params) => {
    const wif = await database.getUTF8(ark.crypto.sha256(Buffer.from(params.userId)).toString('hex'))

    return { wif }
  },
  schema: {
    userId: Joi.string().hex().required()
  }
}
