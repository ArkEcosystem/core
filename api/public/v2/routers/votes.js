const controllers = require('../controllers/votes')

module.exports = (registrar) => {
  registrar.get('votes', controllers.votes)
  registrar.get('votes/:id', controllers.show)
}
