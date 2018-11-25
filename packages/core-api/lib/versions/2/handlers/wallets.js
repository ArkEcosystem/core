const { respondWithCache } = require('../utils')
const schema = require('../schema/wallets')

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
    const data = await request.server.methods.v2.wallets.index(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.index,
  },
}

/**
 * @type {Object}
 */
exports.top = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.wallets.top(request)

    return respondWithCache(data, h)
  },
  // TODO: create top schema
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
    const data = await request.server.methods.v2.wallets.show(request)

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
    const data = await request.server.methods.v2.wallets.transactions(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.transactions,
  },
}

/**
 * @type {Object}
 */
exports.transactionsSent = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.wallets.transactionsSent(
      request,
    )

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.transactionsSent,
  },
}

/**
 * @type {Object}
 */
exports.transactionsReceived = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.wallets.transactionsReceived(
      request,
    )

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.transactionsReceived,
  },
}

/**
 * @type {Object}
 */
exports.votes = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const data = await request.server.methods.v2.wallets.votes(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.votes,
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
    const data = await request.server.methods.v2.wallets.search(request)

    return respondWithCache(data, h)
  },
  options: {
    validate: schema.search,
  },
}
