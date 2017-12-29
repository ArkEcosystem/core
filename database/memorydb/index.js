const DBInterface = requireFrom('core/dbinterface')

class MemoryDB extends DBInterface {
  init(params) {
    throw new Error('MemoryDB Driver has not been implemented yet.')
  }
}

module.exports = MemoryDB
