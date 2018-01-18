module.exports = class RouteRegistrar {
  constructor (server, version, prefix = 'api') {
    this.server = server
    this.version = version
    this.prefix = prefix
  }

  get (path, action, schema) {
    this.server.get(this.buildConfig(path, schema), action)
  }

  post (path, action, schema) {
    this.server.post(this.buildConfig(path, schema), action)
  }

  put (path, action, schema) {
    this.server.put(this.buildConfig(path, schema), action)
  }

  patch (path, action, schema) {
    this.server.patch(this.buildConfig(path, schema), action)
  }

  delete (path, action, schema) {
    this.server.delete(this.buildConfig(path, schema), action)
  }

  buildConfig (path, schema) {
    let config = {
      path: this.prefix + '/' + path,
      version: this.version
    }

    if (schema) {
      config = Object.assign(config, { schema })
    }

    return config
  }
}
