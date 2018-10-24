const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'transactions.info',
  async method (params) {
    const response = await network.getFromNodeApi(`transactions/${params.id}`)

    return response.data.data
  },
  schema: {
    id: Joi.string().length(64).required()
  }
}
