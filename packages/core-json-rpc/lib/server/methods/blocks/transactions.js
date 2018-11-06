const Boom = require('boom')
const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.transactions',
  async method (params) {
    const response = await network.sendRequest(`blocks/${params.id}/transactions`, {
      offset: params.offset,
      orderBy: 'timestamp:desc'
    })

    if (!response) {
      return Boom.notFound(`Block ${params.id} could not be found.`)
    }

    return response ? {
      count: response.meta.totalCount,
      data: response.data
    } : {}
  },
  schema: {
    id: Joi.number().unsafe().required(),
    offset: Joi.number().default(0)
  }
}
