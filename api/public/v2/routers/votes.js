const controllers = require('../controllers/votes')

class VotesRouter {
  register (registrar) {
    registrar.get('votes', controllers.index)
    registrar.get('votes/:id', controllers.show)
  }
}

module.exports = new VotesRouter()
