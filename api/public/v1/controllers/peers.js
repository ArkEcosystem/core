const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const utils = require('../utils')

class PeersController {
  index (req, res, next) {
    blockchain.networkInterface.getPeers().then(peers => {
      if (!peers) return utils.respondWith('error', 'No peers found')

      let retPeers = peers.sort(() => 0.5 - Math.random())
      retPeers = req.query.os ? peers.filter(peer => peer.os === req.query.os) : retPeers
      retPeers = req.query.status ? peers.filter(peer => peer.status === req.query.status) : retPeers
      retPeers = req.query.port ? peers.filter(peer => peer.port === req.query.port) : retPeers
      retPeers = req.query.version ? peers.filter(peer => peer.version === req.query.version) : retPeers
      retPeers = retPeers.slice(0, (req.query.limit || 100))

      retPeers = retPeers.sort((a, b) => a.delay - b.delay)

      if (req.query.orderBy) {
        let order = req.query.orderBy.split(':')
        if (['port', 'status', 'os', 'version'].includes(order[0])) {
          retPeers = order[1].toUpperCase() === 'ASC'
            ? retPeers.sort((a, b) => a[order[0]] - b[order[0]])
            : retPeers.sort((a, b) => a[order[0]] + b[order[0]])
        }
      }

      utils
        .respondWith('ok', { peers: utils.toCollection(retPeers, 'peer') })
        .then(() => next())
    })
  }
  show (req, res, next) {
    blockchain.networkInterface.getPeers().then(peers => {
      if (!peers) return utils.respondWith('error', 'No peers found')

      const peer = peers.find(elem => { return elem.ip === req.query.ip && elem.port === req.query.port })

      if (!peer) return utils.respondWith('error', `Peer ${req.query.ip}:${req.query.port} not found`)

      utils
        .respondWith('ok', { peer: utils.toResource(peer, 'peer') })
        .then(() => next())
    })
  }

  version (req, res, next) {
    utils
      .respondWith('ok', { version: config.server.version })
      .then(() => next())
  }
}

module.exports = new PeersController()
