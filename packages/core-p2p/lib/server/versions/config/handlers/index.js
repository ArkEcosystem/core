const app = require('@arkecosystem/core-container')

const config = app.resolvePlugin('config')
const transform = require('../transformers/plugins')

exports.config = {
  async handler(request, h) {
    return {
      data: {
        version: app.getVersion(),
        network: {
          version: config.network.pubKeyHash,
          nethash: config.network.nethash,
          explorer: config.network.client.explorer,
          token: {
            name: config.network.client.token,
            symbol: config.network.client.symbol,
          },
        },
        plugins: transform(config),
      },
    }
  },
  config: {
    cors: true,
  },
}

exports.network = {
  handler(request, h) {
    return {
      data: require(`${process.env.ARK_PATH_CONFIG}/network.json`),
    }
  },
}

exports.genesisBlock = {
  handler(request, h) {
    return {
      data: require(`${process.env.ARK_PATH_CONFIG}/genesisBlock.json`),
    }
  },
}

exports.peers = {
  handler(request, h) {
    return {
      data: require(`${process.env.ARK_PATH_CONFIG}/peers.json`),
    }
  },
}

exports.delegates = {
  handler(request, h) {
    const data = require(`${process.env.ARK_PATH_CONFIG}/delegates.json`)
    data.secrets = []
    delete data.bip38

    return { data }
  },
}
