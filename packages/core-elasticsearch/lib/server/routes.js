'use strict'

const handler = require('./handler')

/**
 * Register search routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([{
    method: 'POST',
    path: '/',
    ...handler.index
  }])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'Elasticsearch Routes',
  version: '0.1.0',
  register
}
