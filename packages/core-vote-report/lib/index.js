exports.plugin = {
  pkg: require('../package.json'),
  defaults: require('./defaults'),
  alias: 'vote-report',
  async register(container, options) {
    return require('./server')(options)
  },
  async deregister(container, options) {
    return app.resolvePlugin('vote-report').stop()
  },
}
