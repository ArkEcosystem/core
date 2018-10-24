const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.info',
  async method (params) {
    const response = await network.getFromNodeApi(`blocks/${params.id}`)

    return response.data.data
  },
  schema: {
    id: Joi.number().required()
  }
}
