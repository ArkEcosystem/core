const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.info',
  async method (params) {
    const response = await network.getFromNodeApi(`/api/blocks/get?id=${params.id}`)

    return response.data.block
  },
  schema: {
    id: Joi.number().required()
  }
}
