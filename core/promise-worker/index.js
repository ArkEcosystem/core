const goofy = require('core/goofy')
const safeJsonParse = require('utils/safe-json-parse')

let messageIds = 0

module.exports = class PromiseWorker {
  constructor (worker) {
    let self = this
    self._worker = worker
    self._callbacks = {}

    worker.onmessage = (e) => {
      const message = safeJsonParse(e.data)

      if (!message) return

      const messageId = message[0]
      const callback = self._callbacks[messageId]

      if (!callback) return

      delete self._callbacks[messageId]

      callback(message[1], message[2])
    }
  }

  postMessage (userMessage) {
    const self = this
    const messageId = messageIds++

    return new Promise((resolve, reject) => {
      self._callbacks[messageId] = (error, result) => {
        if (error) {
          goofy.error(`Promise Worker caught an error: ${error}`)

          return reject(new Error(error.message))
        }

        resolve(result)
      }

      self._worker.postMessage(JSON.stringify([messageId, userMessage]))
    })
  }
}
