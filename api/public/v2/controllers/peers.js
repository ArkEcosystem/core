const blockchain = requireFrom('core/blockchainManager')
const publicIp = require('public-ip')
const Controller = require('./controller')

class PeersController extends Controller {
  index(req, res, next) {
    super.setState(req, res).then(() => {
      blockchain.getInstance().networkInterface.getPeers()
        .then(peers => {
          let result = peers.sort(() => .5 - Math.random())
          result = req.query.os ? result.filter(peer => { return peer.os === req.query.os }) : result
          result = req.query.status ? result.filter(peer => { return peer.status === req.query.status }) : result
          result = req.query.port ? result.filter(peer => { return peer.port === req.query.port }) : result
          result = req.query.version ? result.filter(peer => { return peer.version === req.query.version }) : result
          result = result.slice(0, (req.query.limit || 100))

          if (req.query.orderBy) {
            const order = req.query.orderBy.split(':')

            if (['port', 'status', 'os', 'version'].includes(order[0])) {
              result = order[1].toUpperCase() === 'ASC'
                ? result.sort((a, b) => a[order[0]] - b[order[0]])
                : result.sort((a, b) => a[order[0]] + b[order[0]])
            }
          }

          super.respondWithCollection(result, result, 'peer')
      })

      next()
    })
  }

  show(req, res, next) {
    super.setState(req, res).then(() => {
      blockchain.getInstance().networkInterface.getPeers()
        .then(peers => {
          const peer = peers.find(p => p.ip === req.params.ip)

          super.respondWithResource(peer, peer, 'peer')
      })

      next()
    })
  }

  me(req, res, next) {
    super.setState(req, res).then(() => {
      publicIp.v4().then(ip => {
        blockchain.getInstance().networkInterface.getPeers()
          .then(peers => {
            const peer = peers.find(p => p.ip === ip)

            super.respondWithResource(peer, peer, 'peer')
        })
      })

      next()
    })
  }
}

module.exports = new PeersController()
