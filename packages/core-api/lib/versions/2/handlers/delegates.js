const schema = require('../schema/delegates')

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
    return request.server.methods.v2.delegates.index(request)
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
    return request.server.methods.v2.delegates.show(request)
  },
  options: {
    validate: schema.show,
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
    return request.server.methods.v2.delegates.search(request)
  },
  options: {
    validate: schema.search,
  },
}

/**
 * @type {Object}
 */
exports.blocks = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    return request.server.methods.v2.delegates.blocks(request)
  },
  options: {
    validate: schema.blocks,
  },
}

/**
 * @type {Object}
 */
exports.voters = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    return request.server.methods.v2.delegates.voters(request)
  },
  options: {
    validate: schema.voters,
  },
}

/**
 * @type {Object}
 */
exports.voterBalances = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    return request.server.methods.v2.delegates.voterBalances(request)
  },
  options: {
    validate: schema.voterBalances,
  },
}
