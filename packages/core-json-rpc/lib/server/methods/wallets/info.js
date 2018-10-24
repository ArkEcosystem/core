const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'wallets.info',
  async method (params) {
    const response = await network.sendRequest(`wallets/${params.address}`)

    return response ? response.data : {}
  },
  schema: {
    address: Joi.string().length(34).required()
  }
}
