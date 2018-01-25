const cache = requireFrom('core/cache')

class CachePlugin {
  before (request, response, next) {
    const cacheKey = this._generateKey(request)

    return this._getInstance().get(cacheKey).then((data) => {
      if (!data) {
        response.header('X-Cache', 'MISS')

        return next()
      }

      response.header('X-Cache', 'HIT')
      response.header('Content-Type', 'application/json')
      response.writeHead(200)
      response.end(data)
    })
  }

  after (request, response, route, error) {
    if (response.statusCode === 200) {
      this._getInstance().set(this._generateKey(request), response._data)
    }
  }

  _generateKey (request) {
    return this._getInstance().generateKey({
      url: request.url,
      params: request.params,
      body: request.body,
      version: request.version()
    })
  }

  _getInstance () {
    return cache.getInstance('ark_api_cache')
  }
}

module.exports = new CachePlugin()
