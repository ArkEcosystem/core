const Boom = require('boom')
const app = require('@arkecosystem/core-container')

const register = async (server, options) => {
  server.ext({
    type: 'onPostAuth',
    async method(request, h) {
      const route = options.routes.find(item => item.path === request.path)

      if (!route) {
        return h.continue
      }

      if (route.method.toLowerCase() !== request.method.toLowerCase()) {
        return h.continue
      }

      const transactionPool = app.resolveOptions('transactionPool')

      if (!transactionPool) {
        return h.continue
      }

      const transactionsCount = request.payload.transactions.length
      const maxTransactionsPerRequest =
        transactionPool.maxTransactionsPerRequest

      if (transactionsCount > maxTransactionsPerRequest) {
        return Boom.entityTooLarge(
          `Received ${transactionsCount} transactions. Only ${maxTransactionsPerRequest} are allowed per request.`,
          {
            allowed: maxTransactionsPerRequest,
            received: transactionsCount,
          },
        )
      }

      return h.continue
    },
  })
}

exports.plugin = {
  name: 'transaction-payload',
  version: '0.1.0',
  register,
}
