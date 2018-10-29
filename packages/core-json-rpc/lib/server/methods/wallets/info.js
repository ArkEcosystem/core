const Boom = require('boom')
const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'wallets.info',
  async method (params) {
    const response = await network.sendRequest(`wallets/${params.address}`)

    return response
      ? response.data
      : Boom.notFound(`Wallet ${params.address} could not be found.`)
  },
  schema: {
    address: Joi.string().length(34).required()
  }
}
