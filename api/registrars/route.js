module.exports = class RouteRegistrar {
  constructor (server, version, prefix = 'api') {
    this.server = server
    this.version = version
    this.prefix = prefix
  }

  get (path, action, options) {
    this.server.get(this.buildConfig(path, options), action)
  }

  post (path, action, options) {
    this.server.post(this.buildConfig(path, options), action)
  }

  put (path, action, options) {
    this.server.put(this.buildConfig(path, options), action)
  }

  patch (path, action, options) {
    this.server.patch(this.buildConfig(path, options), action)
  }

  delete (path, action, options) {
    this.server.delete(this.buildConfig(path, options), action)
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
