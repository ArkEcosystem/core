let instance = null
// TODO here check also
// - exipration date of transactions
// - spamming
// - max size, etc...
module.exports = class MemoryPool {
  constructor (Class) {
    if (!instance) instance = this
    else throw new Error('Can\'t initialise 2 MemoryPools!')

    if (Class === undefined) {
      throw new Error('No arguments');
    }

    if (typeof Class !== 'function') {
      throw new Error(`${Class} is not a function`)
    }

    this.Class = Class
    this.pool = {}
  }

  get size () {
    return Object.keys(this.pool).length
  }

  removeForgedTransactions (forgedIds) {
    forgedIds.forEach(id => {
      this.delete(id)
    })
  }

  add (object) {
    if (object instanceof this.Class) {
      this.pool[object.id] = object.serialized.toString('hex')
    }
  }

  getItems (blockSize) {
    return Object.values(this.pool).slice(0, blockSize)
  }

  delete (id) {
    delete this.pool[id]
  }

  clear () {
    this.pool = {}
  }

  static getInstance () {
    return instance
  }
}
