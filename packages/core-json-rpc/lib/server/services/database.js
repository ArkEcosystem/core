const Keyv = require('keyv')
const fs = require('fs-extra')

class Database {
  init ({ uri, options }) {
    if (uri.startsWith('sqlite://')) {
      fs.ensureFileSync(uri.replace('sqlite://'))
    }

    this.database = new Keyv(uri, options)
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
