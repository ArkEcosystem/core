'use strict'

const immutable = require('immutable')

module.exports = class Storage {
  /**
   * Create a new Storage instance.
   */
  constructor () {
    this.storage = immutable.Map()
  }

  /**
   * Get the storage map.
   * @return {Object}
   */
  all () {
    return this.storage
  }

  /**
   * Get all of the storage entries.
   * @return {Object}
   */
  entries () {
    return this.storage.entries()
  }

  /**
   * Get all of the storage keys.
   * @return {Object}
   */
  keys () {
    return this.storage.keys()
  }

  /**
   * Get all of the storage values.
   * @return {Object}
   */
  values () {
    return this.storage.values()
  }

  /**
   * Retrieve an item from the storage by key.
   * @param  {String} key
   * @return {Immutable.*}
   */
  get (key) {
    if (!this.has(key)) {
      throw new Error(`${key} doesn't exists in storage.`)
    }

    return this.storage.get(key)
  }

  /**
   * Store an item in the storage.
   * @param {String} key
   * @param {Array|Object} value
   * @return {Immutable.*}
   */
  set (key, value) {
    if (this.has(key)) {
      throw new Error(`${key} already exists in storage.`)
    }

    this.storage = this.storage.set(key, value)

    return value
  }

  /**
   * Determine if an item exists in the storage.
   * @param  {String}  key
   * @return {Boolean}
   */
  has (key) {
    return this.storage.has(key)
  }

  /**
   * Remove an item from the storage.
   * @param  {(String|Array)} keys
   * @return {void}
   */
  forget (keys) {
    keys = !Array.isArray(keys) ? [keys] : keys
    for (const key of keys) {
      this.storage = this.storage.delete(key)
    }
  }

  /**
   * Remove all items from the storage.
   * @return {void}
   */
  clear () {
    this.storage = this.storage.clear()
  }

  /**
   * Returns the number of items in the storage.
   * @param  {String} key
   * @return {Number}
   */
  size (key) {
    return key ? this.get(key).length : this.storage.size
  }

  /**
   * Set a new List instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.List}
   */
  setList (key, value) {
    return this.set(key, this.createList(value))
  }

  /**
   * Set a new Map instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Map}
   */
  setMap (key, value) {
    return this.set(key, this.createMap(value))
  }

  /**
   * Set a new OrderedMap instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.OrderedMap}
   */
  setOrderedMap (key, value) {
    return this.set(key, this.createOrderedMap(value))
  }

  /**
   * Set a new Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Set}
   */
  setSet (key, value) {
    return this.set(key, this.createSet(value))
  }

  /**
   * Set a new OrderedSet instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.OrderedSet}
   */
  setOrderedSet (key, value) {
    return this.set(key, this.createOrderedSet(value))
  }

  /**
   * Set a new Stack instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Stack}
   */
  setStack (key, value) {
    return this.set(key, this.createStack(value))
  }

  /**
   * Set a new Range instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Range}
   */
  setRange (key, value) {
    return this.set(key, this.createRange(value))
  }

  /**
   * Set a new Repeat instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Repeat}
   */
  setRepeat (key, value) {
    return this.set(key, this.createRepeat(value))
  }

  /**
   * Set a new Record instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Record}
   */
  setRecord (key, value) {
    return this.set(key, this.createRecord(value))
  }

  /**
   * Set a new Seq instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq}
   */
  setSeq (key, value) {
    return this.set(key, this.createSeq(value))
  }

  /**
   * Set a new Seq.Keyed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Keyed}
   */
  setSeqKeyed (key, value) {
    return this.set(key, this.createSeqKeyed(value))
  }

  /**
   * Set a new Seq.Indexed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Indexed}
   */
  setSeqIndexed (key, value) {
    return this.set(key, this.createSeqIndexed(value))
  }

  /**
   * Set a new Seq.Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Set}
   */
  setSeqSet (key, value) {
    return this.set(key, this.createSeqSet(value))
  }

  /**
   * Set a new Collection instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection}
   */
  setCollection (key, value) {
    return this.set(key, this.createCollection(value))
  }

  /**
   * Set a new Collection.Keyed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Keyed}
   */
  setCollectionKeyed (key, value) {
    return this.set(key, this.createCollectionKeyed(value))
  }

  /**
   * Set a new Collection.Indexed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Indexed}
   */
  setCollectionIndexed (key, value) {
    return this.set(key, this.createCollectionIndexed(value))
  }

  /**
   * Set a new Collection.Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Set}
   */
  setCollectionSet (key, value) {
    return this.set(key, this.createCollectionSet(value))
  }

  /**
   * Create a new List instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.List}
   */
  createList (value) {
    return immutable.List(value)
  }

  /**
   * Create a new Map instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Map}
   */
  createMap (value) {
    return immutable.Map(value)
  }

  /**
   * Create a new OrderedMap instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.OrderedMap}
   */
  createOrderedMap (value) {
    return immutable.OrderedMap(value)
  }

  /**
   * Create a new Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Set}
   */
  createSet (value) {
    return immutable.Set(value)
  }

  /**
   * Create a new OrderedSet instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.OrderedSet}
   */
  createOrderedSet (value) {
    return immutable.OrderedSet(value)
  }

  /**
   * Create a new Stack instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Stack}
   */
  createStack (value) {
    return immutable.Stack(value)
  }

  /**
   * Create a new Range instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Range}
   */
  createRange (value) {
    return immutable.Range(value)
  }

  /**
   * Create a new Repeat instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Repeat}
   */
  createRepeat (value) {
    return immutable.Repeat(value)
  }

  /**
   * Create a new Record instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Record}
   */
  createRecord (value) {
    return immutable.Record(value)
  }

  /**
   * Create a new Seq instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq}
   */
  createSeq (value) {
    return immutable.Seq(value)
  }

  /**
   * Create a new Seq.Keyed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Keyed}
   */
  createSeqKeyed (value) {
    return immutable.Seq.Keyed(value)
  }

  /**
   * Create a new Seq.Indexed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Indexed}
   */
  createSeqIndexed (value) {
    return immutable.Seq.Indexed(value)
  }

  /**
   * Create a new Seq.Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Set}
   */
  createSeqSet (value) {
    return immutable.Seq.Set(value)
  }

  /**
   * Create a new Collection instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection}
   */
  createCollection (value) {
    return immutable.Collection(value)
  }

  /**
   * Create a new Collection.Keyed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Keyed}
   */
  createCollectionKeyed (value) {
    return immutable.Collection.Keyed(value)
  }

  /**
   * Create a new Collection.Indexed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Indexed}
   */
  createCollectionIndexed (value) {
    return immutable.Collection.Indexed(value)
  }

  /**
   * Create a new Collection.Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Set}
   */
  createCollectionSet (value) {
    return immutable.Collection.Set(value)
  }
}
