const responder = requireFrom('api/responder')
const blockchain = requireFrom('core/blockchainManager')
const transformer = requireFrom('api/transformer')
const logger = requireFrom('core/logger')
const publicIp = require('public-ip');

class PeersController {
  index(req, res, next) {
    blockchain.getInstance().networkInterface.getPeers()
      .then(peers => {
        let result = peers
        result = req.query.os ? peers.filter(peer => { return peer.os === req.query.os }) : result
        result = req.query.status ? peers.filter(peer => { return peer.status === req.query.status }) : result
        result = req.query.port ? peers.filter(peer => { return peer.port === req.query.port }) : result
        result = req.query.version ? peers.filter(peer => { return peer.version === req.query.version }) : result
        result = result.slice(req.query.offset || 0, (req.query.offset || 0) + (req.query.limit || 100))
        result = result.sort((a, b) => a.delay - b.delay)

        if (req.query.orderBy) {
          const order = req.query.orderBy.split(':')

          if (['port', 'status', 'os', 'version'].includes(order[0])) {
            result = order[1].toUpperCase() === 'ASC'
              ? result.sort((a, b) => a[order[0]] - b[order[0]])
              : result.sort((a, b) => a[order[0]] + b[order[0]])
          }
        }

        responder.ok(req, res, {
          peers: new transformer(req).collection(result, 'peer'),
        })
    }).catch(error => {
        logger.error(error)

        responder.internalServerError(res, error)
    })

    next()
  }

  show(req, res, next) {
    blockchain.getInstance().networkInterface.getPeers()
      .then(peers => {
        const peer = peers.find(elem => elem.ip === req.params.ip)

        if (peer) {
          responder.ok(req, res, {
            peer: new transformer(req).resource(peer, 'peer'),
          })
        } else {
          responder.notFound(res, {
            error: `Peer [${req.params.ip}] not found`,
          })
        }
    }).catch(error => {
      logger.error(error)

      responder.internalServerError(res, error)
    })

    next()
  }

  me(req, res, next) {
    publicIp.v4().then(ip => {
      blockchain.getInstance().networkInterface.getPeers()
        .then(peers => {
          const peer = peers.find(elem => elem.ip === ip)

          responder.ok(req, res, {
            peer: new transformer(req).resource(peer, 'peer'),
          })
      }).catch(error => {
        logger.error(error)

        responder.internalServerError(res, error)
      })
    })


    next()
  }
}

module.exports = new PeersController()
