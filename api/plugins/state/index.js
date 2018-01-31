let instance = null

class StatePlugin {
  constructor () {
    if (!instance) instance = this

    return instance
  }

  getRequest () {
    return instance.request
  }

  setRequest (value) {
    instance.request = value
  }

  getResponse () {
    return instance.response
  }

  setResponse (value) {
    instance.response = value
  }
}

module.exports = new StatePlugin()
