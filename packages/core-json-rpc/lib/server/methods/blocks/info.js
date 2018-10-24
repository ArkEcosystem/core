const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.info',
  async method (params) {
    const response = await network.sendRequest(`blocks/${params.id}`)

    return response ? response.data : {}
  },
  schema: {
    id: Joi.number().required()
  }
}
