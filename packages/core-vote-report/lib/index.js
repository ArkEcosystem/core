'use strict'

exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'vote-report',
  async register (container, options) {
    return require('./server')(options)
  },
  async deregister (container, options) {
    return container.resolvePlugin('vote-report').stop()
  }
}
