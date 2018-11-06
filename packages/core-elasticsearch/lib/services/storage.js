'use strict'

const fs = require('fs-extra')
const _ = require('lodash')

class Storage {
  /**
   * Create a new storage instance.
   * @return {void}
   */
  constructor () {
    this.base = `${process.env.ARK_PATH_DATA}/plugins/core-elasticsearch`
  }

  /**
   * Read & parse the specified file.
   * @param  {String} file
   * @return {Object}
   */
  read (file) {
    return this.exists(file) ? JSON.parse(fs.readFileSync(`${this.base}/${file}.json`)) : {}
  }

  /**
   * Write the specified data to the specified file.
   * @param  {String} file
   * @param  {Object} data
   * @return {void}
   */
  write (file, data) {
    fs.ensureFileSync(`${this.base}/${file}.json`)

    fs.writeFileSync(`${this.base}/${file}.json`, JSON.stringify(data, null, 2))
  }

  /**
   * Update the specified data in the specified file.
   * @param  {String} file
   * @param  {Object} data
   * @return {void}
   */
  update (file, data) {
    fs.ensureFileSync(`${this.base}/${file}.json`)

    data = Object.assign(this.read(file), data)

    fs.writeFileSync(`${this.base}/${file}.json`, JSON.stringify(data, null, 2))
  }

  /**
   * Update the specified data in the specified file.
   * @param  {String} file
   * @param  {Object} data
   * @return {void}
   */
  ensure (file) {
    if (!this.exists(file)) {
      fs.ensureFileSync(`${this.base}/${file}.json`)

      fs.writeFileSync(`${this.base}/${file}.json`, JSON.stringify({
        lastRound: 0,
        lastBlock: 0,
        lastTransaction: 0
      }, null, 2))
    }
  }

  /**
   * Determine if the specified file exists.
   * @param  {String} file
   * @return {Boolean}
   */
  exists (file) {
    return fs.existsSync(`${this.base}/${file}.json`)
  }

  /**
   * Get a value from the specified file for the specified key.
   * @param  {String} file
   * @param  {String} key
   * @param  {*} key
   * @return {*}
   */
  get (file, key, defaultValue = null) {
    return _.get(this.read(file), key, defaultValue)
  }
}

module.exports = new Storage()
