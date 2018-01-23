const controllers = require('../controllers/votes')

module.exports = (registrar) => {
  registrar.get('votes', controllers.index)
  registrar.get('votes/:id', controllers.show)
}
