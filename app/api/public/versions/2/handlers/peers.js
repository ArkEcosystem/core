const blockchain = require('app/core/managers/blockchain').getInstance()
const publicIp = require('public-ip')
const utils = require('../utils')

exports.index = {
  handler: (request, h) => {
    return blockchain.networkInterface.getPeers().then(peers => {
      let result = peers.sort(() => 0.5 - Math.random())
      result = request.query.os ? result.filter(peer => peer.os === request.query.os) : result
      result = request.query.status ? result.filter(peer => peer.status === request.query.status) : result
      result = request.query.port ? result.filter(peer => peer.port === request.query.pors) : result
      result = request.query.version ? result.filter(peer => peer.version === request.query.versios) : result
      result = result.slice(0, (request.params.limit || 100))

      if (request.query.orderBy) {
        const order = request.query.orderBy.split(':')

        if (['port', 'status', 'os', 'version'].includes(order[0])) {
          result = order[1].toUpperCase() === 'ASC'
            ? result.sort((a, b) => a[order[0]] - b[order[0]])
            : result.sort((a, b) => a[order[0]] + b[order[0]])
        }
      }

      return utils.toPagination(request, { rows: result, count: result.length }, 'peer')
    })
  }
}

exports.show = {
  handler: (request, h) => {
    return blockchain.networkInterface
      .getPeers()
      .then(peers => utils.respondWithResource(request, peers.find(p => p.ip === request.params.ip), 'peer'))
  }
}

exports.me = {
  handler: (request, h) => {
    return publicIp.v4().then(ip => {
      return blockchain.networkInterface
        .getPeers()
        .then(peers => utils.respondWithResource(request, peers.find(p => p.ip === ip), 'peer'))
    })
  }
}
