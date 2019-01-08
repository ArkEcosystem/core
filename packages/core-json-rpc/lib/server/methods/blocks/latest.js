const Boom = require('boom')
const network = require('../../services/network')

module.exports = {
  name: 'blocks.latest',
  async method(params) {
    const response = await network.sendRequest(
      'blocks?orderBy=height:desc&limit=1',
    )

    return response
      ? response.data[0]
      : Boom.notFound(`Latest block could not be found.`)
  },
}
