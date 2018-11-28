const {
  createServer,
  mountServer,
  plugins,
} = require('@arkecosystem/core-http-utils')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (p2p, config) => {
  const server = await createServer({
    host: config.host,
    port: config.port,
  })

  // TODO: enable after mainnet migration
  // await server.register({ plugin: plugins.contentType })

  await server.register({
    plugin: require('hapi-rate-limit'),
    options: config.rateLimit,
  })

  await server.register({
    plugin: require('./plugins/validate-headers'),
  })

  await server.register({
    plugin: require('./plugins/accept-request'),
    options: {
      whitelist: config.whitelist,
    },
  })

  await server.register({
    plugin: require('./plugins/set-headers'),
  })

  await server.register({
    plugin: require('./plugins/blockchain-ready'),
    options: {
      routes: [
        '/peer/height',
        '/peer/blocks/common',
        '/peer/status',
        '/peer/blocks',
        '/peer/transactions',
        '/peer/getTransactionsFromIds',
        '/internal/round',
        '/internal/blocks',
        '/internal/forgingTransactions',
        '/internal/networkState',
        '/internal/syncCheck',
        '/internal/usernames',
        '/remote/blockchain/{event}',
      ],
    },
  })

  await server.register({
    plugin: plugins.corsHeaders,
  })

  await server.register({
    plugin: plugins.transactionPayload,
    options: {
      routes: [
        {
          method: 'POST',
          path: '/peer/transactions',
        },
      ],
    },
  })

  // await server.register({
  //   plugin: require('./plugins/transaction-pool-ready'),
  //   options: {
  //     routes: [
  //       '/peer/transactions'
  //     ]
  //   }
  // })

  await server.register({
    plugin: require('./versions/config'),
    routes: { prefix: '/config' },
  })

  await server.register({
    plugin: require('./versions/1'),
    routes: { prefix: '/peer' },
  })

  await server.register({
    plugin: require('./versions/internal'),
    routes: { prefix: '/internal' },
  })

  if (config.remoteInterface) {
    await server.register({
      plugin: require('./versions/remote'),
      routes: { prefix: '/remote' },
    })
  }

  return mountServer('P2P API', server)
}
