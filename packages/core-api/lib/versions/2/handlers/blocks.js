const { respondWithCache } = require('../utils')
const schema = require('../schema/blocks')

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
    const data = await request.server.methods.v2.blocks.index(request)

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
    const data = await request.server.methods.v2.blocks.show(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.show,
  },
}

/**
 * @type {Object}
 */
exports.transactions = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.blocks.transactions(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.transactions,
  },
}

/**
 * @type {Object}
 */
exports.search = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.blocks.search(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.search,
  },
}
