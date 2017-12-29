const DBInterface = requireFrom('core/dbinterface')
const levelup = require('levelup')
const leveldown = require('leveldown')

class LevelDB extends DBInterface {
  init(params) {
    throw new Error('LevelDB Driver has not been implemented yet.')
  }
}

module.exports = LevelDB
