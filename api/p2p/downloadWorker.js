const axios = require('axios')
const registerPromiseWorker = require('promise-worker/register')

registerPromiseWorker(message => {
  if (message.height) {
    return axios
      .get(message.url + '/peer/blocks?lastBlockHeight=' + message.height, {
        headers: message.headers,
        timeout: 60000
      })
  }
})
