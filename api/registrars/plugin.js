module.exports = class PluginRegistrar {
  constructor (server) {
    this.server = server
  }

  pre (method, params = {}) {
    this.server.pre((req, res, next) => params.length ? method(params) : method(req, res, next))

    return this
  }

  use (method, instance = true) {
    instance ? this.server.use(method) : this.server.use((req, res, next) => method(req, res, next))

    return this
  }

  on (event, method) {
    this.server.on(event, method)

    return this
  }
}
