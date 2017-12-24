class RouteRegistrar {
  constructor(server, version, prefix = 'api') {
    this.server = server
    this.version = version
    this.prefix = prefix
  }

  get(path, action) {
    this.server.get({
      path: this.prefix + '/' + path,
      version: this.version
    }, action)
  }

  post(path, action) {
    this.server.post({
      path: this.prefix + '/' + path,
      version: this.version
    }, action)
  }

  put(path, action) {
    this.server.put({
      path: this.prefix + '/' + path,
      version: this.version
    }, action)
  }

  patch(path, action) {
    this.server.patch({
      path: this.prefix + '/' + path,
      version: this.version
    }, action)
  }

  delete(path, action) {
    this.server.delete({
      path: this.prefix + '/' + path,
      version: this.version
    }, action)
  }
}

module.exports = RouteRegistrar
