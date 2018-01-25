let instance = null

module.exports = class StatePlugin {
  static getInstance () {
    return instance
  }

  mount (request, response, next) {
    if (!instance) {
      instance = this
    }

    instance.request = request
    instance.response = response

    next()
  }

  static getRequest () {
    return instance.request
  }

  static getResponse () {
    return instance.response
  }
}
