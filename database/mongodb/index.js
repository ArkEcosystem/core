const DBInterface = requireFrom('core/dbinterface')
const MongoClient = require('mongodb').MongoClient

class MongoDB extends DBInterface {
  init(params) {
    throw new Error('MongoDB Driver has not been implemented yet.')
  }
}

module.exports = MongoDB
