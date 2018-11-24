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
    return request.server.methods.v2.wallets.index(request)
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
    return request.server.methods.v2.wallets.top(request)
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
    return request.server.methods.v2.wallets.show(request)
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
    return request.server.methods.v2.wallets.transactions(request)
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
    return request.server.methods.v2.wallets.transactionsSent(request)
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
    return request.server.methods.v2.wallets.transactionsReceived(request)
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
    return request.server.methods.v2.wallets.votes(request)
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
    return request.server.methods.v2.wallets.search(request)
  },
  options: {
    validate: schema.search,
  },
}
