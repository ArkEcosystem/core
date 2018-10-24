const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.transactions',
  async method (params) {
    const response = await network.getFromNodeApi(`blocks/${params.id}/transactions`, {
      offset: params.offset,
      orderBy: 'timestamp:desc'
    })

    return {
      count: response.data.count,
      transactions: response.data.transactions
    }
  },
  schema: {
    id: Joi.number().required(),
    offset: Joi.number().default(0)
  }
}
