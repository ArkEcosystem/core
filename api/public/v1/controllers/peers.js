const responder = requireFrom('api/responder')
const blockchain = requireFrom('core/blockchainManager')
const logger = requireFrom('core/logger')
const config = requireFrom('core/config')
const helpers = require('../helpers')

class PeersController {
  index (req, res, next) {
    blockchain.getInstance().networkInterface.getPeers()
      .then(peers => {
        if (peers) {
          let retPeers = peers.sort(() => 0.5 - Math.random())
          retPeers = req.query.os ? peers.filter(peer => { return peer.os === req.query.os }) : retPeers
          retPeers = req.query.status ? peers.filter(peer => { return peer.status === req.query.status }) : retPeers
          retPeers = req.query.port ? peers.filter(peer => { return peer.port === req.query.port }) : retPeers
          retPeers = req.query.version ? peers.filter(peer => { return peer.version === req.query.version }) : retPeers
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
        } else {
          helpers.respondWith('error', {
            error: 'No peers found'
          })
        }
    }).catch(error => {
        logger.error(error)

        helpers.respondWith('error', {
          error: error
        })
    })
  }
  show (req, res, next) {
    blockchain.getInstance().networkInterface.getPeers()
      .then(peers => {
        if (peers) {
          let peer = peers.find(elem => { return elem.ip === req.query.ip && elem.port === req.query.port })

          if (peer) {
            helpers.respondWith('ok', {
              peer: helpers.toResource(peer, 'peer')
            })
          } else {
            helpers.respondWith('error', {
              error: `Peer ${req.query.ip}:${req.query.port} not found`
            })
          }
        } else {
          helpers.respondWith('error', {
            error: 'No peers found'
          })
        }
    }).catch(error => {
      logger.error(error)

      helpers.respondWith('error', {
        error: error
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
