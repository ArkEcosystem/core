const Joi = require('joi')
const network = require('../../services/network')

module.exports = {
  name: 'accounts.info',
  async method (params) {
    const response = await network.getFromNode(`/api/accounts?address=${params.address}`)

    return response.data.account
  },
  schema: {
    address: Joi.string().length(34).required()
  }
}
