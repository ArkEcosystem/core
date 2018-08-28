'use strict'

const immutable = require('immutable')
const { get, set, has, omit } = require('lodash')

module.exports = class Storage {
  /**
   * Create a new Storage instance.
   */
  constructor () {
    this.storage = {}
  }

  /**
   * Get all of the storage data.
   * @return {[type]}
   */
  all () {
    return this.storage
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

    return get(this.storage, key)
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

    set(this.storage, key, value)

    return value
  }

  /**
   * Determine if an item exists in the storage.
   * @param  {String}  key
   * @return {Boolean}
   */
  has (key) {
    return has(this.storage, key)
  }

  /**
   * Remove an item from the storage.
   * @param  {String} key
   * @return {void}
   */
  forget (key) {
    if (!this.has(key)) {
      throw new Error(`${key} doesn't exists in storage.`)
    }

    this.storage = omit(this.storage, [key])
  }

  /**
   * Remove all items from the storage.
   * @return {void}
   */
  flush () {
    this.storage = {}
  }

  /**
   * [size description]
   * @param  {String} key
   * @return {Number}
   */
  size (key) {
    return Object.entries(key ? this.get(key) : this.storage).length
  }

  /**
   * Create a new List instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.List}
   */
  createList (key, value) {
    return this.set(key, immutable.List(value))
  }

  /**
   * Create a new Map instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Map}
   */
  createMap (key, value) {
    return this.set(key, immutable.Map(value))
  }

  /**
   * Create a new OrderedMap instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.OrderedMap}
   */
  createOrderedMap (key, value) {
    return this.set(key, immutable.OrderedMap(value))
  }

  /**
   * Create a new Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Set}
   */
  createSet (key, value) {
    return this.set(key, immutable.Set(value))
  }

  /**
   * Create a new OrderedSet instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.OrderedSet}
   */
  createOrderedSet (key, value) {
    return this.set(key, immutable.OrderedSet(value))
  }

  /**
   * Create a new Stack instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Stack}
   */
  createStack (key, value) {
    return this.set(key, immutable.Stack(value))
  }

  /**
   * Create a new Range instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Range}
   */
  createRange (key, value) {
    return this.set(key, immutable.Range(value))
  }

  /**
   * Create a new Repeat instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Repeat}
   */
  createRepeat (key, value) {
    return this.set(key, immutable.Repeat(value))
  }

  /**
   * Create a new Record instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Record}
   */
  createRecord (key, value) {
    return this.set(key, immutable.Record(value))
  }

  /**
   * Create a new Seq instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq}
   */
  createSeq (key, value) {
    return this.set(key, immutable.Seq(value))
  }

  /**
   * Create a new Seq.Keyed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Keyed}
   */
  createSeqKeyed (key, value) {
    return this.set(key, immutable.Seq.Keyed(value))
  }

  /**
   * Create a new Seq.Indexed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Indexed}
   */
  createSeqIndexed (key, value) {
    return this.set(key, immutable.Seq.Indexed(value))
  }

  /**
   * Create a new Seq.Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Seq.Set}
   */
  createSeqSet (key, value) {
    return this.set(key, immutable.Seq.Set(value))
  }

  /**
   * Create a new Collection instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection}
   */
  createCollection (key, value) {
    return this.set(key, immutable.Collection(value))
  }

  /**
   * Create a new Collection.Keyed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Keyed}
   */
  createCollectionKeyed (key, value) {
    return this.set(key, immutable.Collection.Keyed(value))
  }

  /**
   * Create a new Collection.Indexed instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Indexed}
   */
  createCollectionIndexed (key, value) {
    return this.set(key, immutable.Collection.Indexed(value))
  }

  /**
   * Create a new Collection.Set instance.
   * @param  {String} key
   * @param  {Array|Object} value
   * @return {Immutable.Collection.Set}
   */
  createCollectionSet (key, value) {
    return this.set(key, immutable.Collection.Set(value))
  }
}
