const controller = requireFrom('api/public/v1/controllers/peers')
const schema = requireFrom('api/public/v1/schemas/peers')


class PeersRouter {
  register(registrar) {
    registrar.get('peers', controller.index, schema.getPeers)
    registrar.get('peers/get', controller.show, schema.getPeer)
    registrar.get('peers/version', controller.version)
  }
}

module.exports = new PeersRouter()
