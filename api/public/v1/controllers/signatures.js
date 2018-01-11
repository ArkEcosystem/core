const responder = requireFrom('api/responder')
const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')

class SignaturesController {
  fee(req, res, next) {
    responder.ok(req, res,{
      fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.secondsignature
    })

    next()
  }
}

module.exports = new SignaturesController()
