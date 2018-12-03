const { respondWithCache } = require('../utils')
const schema = require('../schema/votes')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.votes.index(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.index,
  },
}

/**
 * @type {Object}
 */
exports.show = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.votes.show(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.show,
  },
}
