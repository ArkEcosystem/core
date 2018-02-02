const goofy = require('core/goofy')
const isPromise = require('is-promise')
const safeJsonParse = require('utils/safe-json-parse')

module.exports = (callback) => {
  function postOutgoingMessage (e, messageId, error, result) {
    if (error) {
      goofy.error(`Promise  Worker caught an error: ${error}`)

      self.postMessage(JSON.stringify([messageId, { message: error.message }]))
    } else {
      self.postMessage(JSON.stringify([messageId, null, result]))
    }
  }

  function handleIncomingMessage (e, callback, messageId, message) {
    let result = null

    try { result = { res: callback(message) } } catch (e) { result = {err: e} }

    if (result.err) {
      goofy.error(`Promise  Worker caught an error: ${result.err}`)

      postOutgoingMessage(e, messageId, result.err)
    } else if (!isPromise(result.res)) {
      postOutgoingMessage(e, messageId, null, result.res)
    } else {
      result.res
        .then((result) => postOutgoingMessage(e, messageId, null, result))
        .catch((error) => postOutgoingMessage(e, messageId, error))
    }
  }

  self.onmessage = (e) => {
    const payload = safeJsonParse(e.data)

    if (!payload) return

    handleIncomingMessage(e, callback, payload[0], payload[1])
  }
}
