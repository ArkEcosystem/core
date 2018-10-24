const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'transactions.info',
  async method (params) {
    const response = await network.sendRequest(`transactions/${params.id}`)

    return response.data
  },
  schema: {
    id: Joi.string().length(64).required()
  }
}
