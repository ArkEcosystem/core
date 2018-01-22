const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const helpers = require('../helpers')

class PeersController {
  index (req, res, next) {
    blockchain.networkInterface.getPeers()
      .then(peers => {
        if (!peers) return helpers.respondWith('error', 'No peers found')

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

        helpers.respondWith('ok', {
          peers: helpers.toCollection(retPeers, 'peer')
        })
    })
  }
  show (req, res, next) {
    blockchain.networkInterface.getPeers()
      .then(peers => {
        if (!peers) return helpers.respondWith('error', 'No peers found')

        let peer = peers.find(elem => { return elem.ip === req.query.ip && elem.port === req.query.port })

        if (!peer) return helpers.respondWith('error', `Peer ${req.query.ip}:${req.query.port} not found`)

        helpers.respondWith('ok', {
          peer: helpers.toResource(peer, 'peer')
        })
    })
  }

  version (req, res, next) {
    helpers.respondWith('ok', {
      version: config.server.version
    })
  }
}

module.exports = new PeersController()
