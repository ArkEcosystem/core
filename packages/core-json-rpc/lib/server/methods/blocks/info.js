const Boom = require('boom')
const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.info',
  async method (params) {
    const response = await network.sendRequest(`blocks/${params.id}`)

    return response
      ? response.data
      : Boom.notFound(`Block ${params.id} could not be found.`)
  },
  schema: {
    id: Joi.number().unsafe().required()
  }
}
