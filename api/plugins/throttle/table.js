const lru = require('lru-cache')

class Table {
  constructor(options) {
    this.table = new lru(options.size || 10000)
  }

  get(key) {
    return this.table.get(key)
  }

  set(key, value) {
    return this.table.set(key, value)
  }
}

module.exports = Table
