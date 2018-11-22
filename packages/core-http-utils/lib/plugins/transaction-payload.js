const Boom = require('boom')
const container = require('@arkecosystem/core-container')

const register = async (server, options) => {
  server.ext({
    type: 'onPostAuth',
    async method(request, h) {
      if (!options.paths.includes(request.path)) {
        return h.continue
      }

      const transactionPool = container.resolveOptions('transactionPool')

      if (!transactionPool) {
        return h.continue
      }

      const transactionsCount = request.payload.transactions.length
      const maxTransactionsPerRequest =
        transactionPool.maxTransactionsPerRequest

      if (transactionsCount > maxTransactionsPerRequest) {
        return Boom.entityTooLarge(
          `Received ${transactionsCount} transactions. Only ${maxTransactionsPerRequest} are allowed per request.`,
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
