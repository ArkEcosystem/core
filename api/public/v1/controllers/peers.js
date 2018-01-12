const responder = requireFrom('api/responder')
const blockchain = requireFrom('core/blockchainManager')
const transformer = requireFrom('api/transformer')
const logger = requireFrom('core/logger')
const config = requireFrom('core/config')

class PeersController {

  index(req, res, next) {
    blockchain.getInstance().networkInterface.getPeers()
      .then(peers => {
        if (!!peers) {
          let result = peers.sort(() => .5 - Math.random())
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

          responder.ok(req, res, {
            peers: new transformer(req).collection(retPeers, 'peer'),
          })
        } else {
          responder.error(req, res, {
            error: `No peers found`,
          })
        }
    }).catch(error => {
        logger.error(error)

        responder.error(req, res, {
          error: error
        })
    })

    next()
  }

  show(req, res, next) {
    blockchain.getInstance().networkInterface.getPeers()
      .then(peers => {
        if (!!peers) {
          let peer = peers.find(elem => {return elem.ip === req.query.ip && elem.port === req.query.port})

          if (!!peer) {
            responder.ok(req, res, {
              peer: new transformer(req).resource(peer, 'peer'),
            })
          }else {
            responder.error(req, res, {
              error: `Peer ${req.query.ip}:${req.query.port} not found`,
            })
          }
        }else {
          responder.error(req, res, {
            error: `No peers found`,
          })
        }
    }).catch(error => {
      logger.error(error)

      responder.error(req, res, {
        error: error
      })
    })

    next()
  }

  version(req, res, next) {
    responder.ok(req,res, {
      version: config.server.version
    })

    next()
  }
}

module.exports = new PeersController()
