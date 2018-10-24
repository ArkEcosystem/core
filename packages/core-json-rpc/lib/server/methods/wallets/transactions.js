const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'wallets.transactions',
  async method (params) {
    const response = await network.sendRequest('transactions', {
      offset: params.offset,
      orderBy: 'timestamp:desc',
      senderId: params.address,
      recipientId: params.address
    })

    return response.data
  },
  schema: {
    address: Joi.string().length(34).required(),
    offset: Joi.number().default(0)
  }
}
