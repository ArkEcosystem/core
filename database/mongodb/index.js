const DBInterface = requireFrom('core/dbinterface')
const MongoClient = require('mongodb').MongoClient

class MongoDB extends DBInterface {
  init(params) {
    throw new Error('MongoDB Driver has not been implemented yet.')
  }

  repository(name)
  {
    return require(`${__dirname}/repositories/${name}`)
  }
}

module.exports = MongoDB
