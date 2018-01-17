class MultiSignaturesController {
  index (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('notImplemented', 'Method has not yet been implemented.')
    })
  }

  pending (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('notImplemented', 'Method has not yet been implemented.')
    })
  }

  wallets (req, res, next) {
    super.init(req, res, next).then(() => {
      super.respondWith('notImplemented', 'Method has not yet been implemented.')
    })
  }
}

module.exports = new MultiSignaturesController()
