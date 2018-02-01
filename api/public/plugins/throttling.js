const PLUGIN_NAME = 'hapi-throttling'

const Boom = require('boom')

const register = async (server, options) => {}

exports.plugin = {
  name: PLUGIN_NAME,
  version: '1.0.0',
  register
}
