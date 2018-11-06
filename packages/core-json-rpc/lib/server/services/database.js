const Keyv = require('keyv')

class Database {
  init (options) {
    this.database = new Keyv(options)
  }

  async get (id) {
    return this.database.get(id)
  }

  async set (id, value) {
    return this.database.set(id, value)
  }

  async delete (id) {
    return this.database.delete(id)
  }

  async clear () {
    return this.database.clear()
  }
}

module.exports = new Database()
