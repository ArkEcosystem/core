const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'transactions.info',
  async method (params) {
    const response = await network.getFromNode(`/api/transactions/get?id=${params.id}`)

    return response.data.transaction
  },
  schema: {
    id: Joi.string().length(64).required()
  }
}
