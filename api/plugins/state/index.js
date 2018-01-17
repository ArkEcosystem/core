let instance = null

module.exports = class State {
  static getInstance () {
    return instance
  }

  constructor (request, response, next) {
    if (!instance) {
      instance = this
    }

    instance.request = request
    instance.response = response
    instance.next = next

    next()
  }

  static getRequest () {
    return instance.request
  }

  static getResponse () {
    return instance.response
  }

  static getNext () {
    return instance.next
  }
}
