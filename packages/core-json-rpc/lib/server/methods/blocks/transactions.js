const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.transactions',
  async method (params) {
    const response = await network.sendRequest(`blocks/${params.id}/transactions`, {
      offset: params.offset,
      orderBy: 'timestamp:desc'
    })

    return {
      count: response.meta.totalCount,
      data: response.data
    }
  },
  schema: {
    id: Joi.number().required(),
    offset: Joi.number().default(0)
  }
}
