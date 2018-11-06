const Boom = require('boom')
const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'transactions.info',
  async method (params) {
    const response = await network.sendRequest(`transactions/${params.id}`)

    return response
      ? response.data
      : Boom.notFound(`Transaction ${params.id} could not be found.`)
  },
  schema: {
    id: Joi.string().length(64).required()
  }
}
