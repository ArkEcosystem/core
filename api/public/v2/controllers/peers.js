const blockchain = requireFrom('core/blockchainManager').getInstance()
const publicIp = require('public-ip')
const helpers = require('../helpers')

class PeersController {
  index (req, res, next) {
    blockchain.networkInterface.getPeers()
      .then(peers => {
        let result = peers.sort(() => 0.5 - Math.random())
        result = req.params.os ? result.filter(peer => peer.os === req.params.os) : result
        result = req.params.status ? result.filter(peer => peer.status === req.params.status) : result
        result = req.params.port ? result.filter(peer => peer.port === req.params.pors) : result
        result = req.params.version ? result.filter(peer => peer.version === req.params.versios) : result
        result = result.slice(0, (req.params.limit || 100))

        if (req.params.orderBy) {
          const order = req.params.orderBy.split(':')

          if (['port', 'status', 'os', 'version'].includes(order[0])) {
            result = order[1].toUpperCase() === 'ASC'
              ? result.sort((a, b) => a[order[0]] - b[order[0]])
              : result.sort((a, b) => a[order[0]] + b[order[0]])
          }
        }

        helpers.respondWithCollection(result, 'peer')
    })
  }

  show (req, res, next) {
    blockchain.networkInterface
      .getPeers()
      .then(peers => helpers.respondWithResource(peers.find(p => p.ip === req.params.ip), 'peer'))
  }

  me (req, res, next) {
    publicIp.v4().then(ip => {
      blockchain.networkInterface
        .getPeers()
        .then(peers => helpers.respondWithResource(peers.find(p => p.ip === ip), 'peer'))
    })
  }
}

module.exports = new PeersController()
