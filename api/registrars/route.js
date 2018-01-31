module.exports = class RouteRegistrar {
  constructor (server, version, prefix = 'api') {
    this.server = server
    this.version = version
    this.prefix = prefix
  }
  postBlock (req, res, next) {
    res.send(200, {
      success: true
    })
    next()
  }
  get (path, action, options) {
    this.server.get(this.buildConfig(path, options), (req, res, next) => action(req, res, next))
  }

  post (path, action, options) {
    this.server.post(this.buildConfig(path, options), (req, res, next) => action(req, res, next))
  }

  put (path, action, options) {
    this.server.put(this.buildConfig(path, options), (req, res, next) => action(req, res, next))
  }

  patch (path, action, options) {
    this.server.patch(this.buildConfig(path, options), (req, res, next) => action(req, res, next))
  }

  delete (path, action, options) {
    this.server.delete(this.buildConfig(path, options), (req, res, next) => action(req, res, next))
  }

  buildConfig (path, options) {
    let config = {
      path: this.prefix + '/' + path,
      version: this.version
    }

    if (options) config = {...config, ...options}

    return config
  }
}
