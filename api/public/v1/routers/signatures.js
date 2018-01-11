const controller = requireFrom('api/public/v1/controllers/signatures')
const schema = requireFrom('api/public/v1/schemas/peers')

class SignaturesRouter {
  register(registrar) {
    registrar.get('signatures/fee', controller.fee)
  }
}

module.exports = new SignaturesRouter()
