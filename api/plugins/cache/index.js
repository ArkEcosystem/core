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
      response.writeHead(200)
      response.end(data)
    })
  }

  after (request, response, route, error) {
    this._getInstance().set(this._generateKey(request), response._data);
  }

  _generateKey (request) {
    return this._getInstance().generateKey({
      url: request.url,
      params: request.params
    })
  }

  _getInstance () {
    return cache.getInstance('ark_api_cache')
  }
}

module.exports = new CachePlugin()
