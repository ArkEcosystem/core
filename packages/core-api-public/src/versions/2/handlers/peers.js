const blockchain = require('../../../../../core/src/core/managers/blockchain').getInstance()
const utils = require('../utils')
const schema = require('../schema/peers')

exports.index = {
  handler: async (request, h) => {
    const peers = await blockchain.networkInterface.getPeers()

    let result = peers.sort(() => 0.5 - Math.random())
    result = request.query.os ? result.filter(peer => peer.os === request.query.os) : result
    result = request.query.status ? result.filter(peer => peer.status === request.query.status) : result
    result = request.query.port ? result.filter(peer => peer.port === request.query.port) : result
    result = request.query.version ? result.filter(peer => peer.version === request.query.version) : result
    result = result.slice(0, (request.query.limit || 100))

    if (request.query.orderBy) {
      const order = request.query.orderBy.split(':')

      if (['port', 'status', 'os', 'version'].includes(order[0])) {
        result = order[1].toUpperCase() === 'ASC'
          ? result.sort((a, b) => a[order[0]] - b[order[0]])
          : result.sort((a, b) => a[order[0]] + b[order[0]])
      }
    }

    return utils.toPagination(request, { rows: result, count: result.length }, 'peer')
  },
  options: {
    validate: schema.index
  }
}

exports.show = {
  handler: async (request, h) => {
    const peers = await blockchain.networkInterface.getPeers()

    return utils.respondWithResource(request, peers.find(p => p.ip === request.params.ip), 'peer')
  },
  options: {
    validate: schema.show
  }
}
