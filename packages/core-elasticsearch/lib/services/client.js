'use strict'

const elasticsearch = require('elasticsearch')

class Client {
  /**
   * Create a new client instance.
   * @param {Object} options
   */
  async setUp (options) {
    this.client = new elasticsearch.Client(options)
  }

  /**
   * Get the elasticsearch client.
   * @return {elasticsearch.Client}
   */
  async getClient () {
    return this.client
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} body
   * @return {Promise}
   */
  async bulk (body) {
    return this.client.bulk({ body })
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} params
   * @return {Promise}
   */
  async count (params) {
    return this.client.count(params)
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} params
   * @return {Promise}
   */
  async search (params) {
    return this.client.search(params)
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} params
   * @return {Promise}
   */
  async create (params) {
    return this.client.create(params)
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} params
   * @return {Promise}
   */
  async update (params) {
    return this.client.update(params)
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} params
   * @return {Promise}
   */
  async delete (params) {
    return this.client.delete(params)
  }

  /**
   * Perform an "UPDATE" operation.
   * @param  {Object} params
   * @return {Promise}
   */
  async exists (params) {
    return this.client.exists(params)
  }
}

module.exports = new Client()
