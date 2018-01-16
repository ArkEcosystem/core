const cache = requireFrom('core/cache')

class CacheDecorator {
  cachePromise (method, keyArgs, promise) {
    const cacheKey = cache.generateKey(Object.assign({
      collection: this.constructor.name, method
    }, keyArgs))

    return cache.get(cacheKey).then((data) => {
      if (data) return data

      return promise.then(res => {
        cache.set(cacheKey, res);

        return res;
      })
    })
  }
}

module.exports = CacheDecorator
