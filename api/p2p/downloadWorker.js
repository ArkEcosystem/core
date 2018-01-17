const popsicle = require('popsicle')
const registerPromiseWorker = require('promise-worker/register')

registerPromiseWorker(message => {
  if (message.height) {
    return popsicle
      .request({
        method: 'GET',
        url: message.url + '/peer/blocks?lastBlockHeight=' + message.height,
        headers: message.headers,
        timeout: 60000
      })
      .use(popsicle.plugins.parse('json'))
      .catch(error => console.warn(error.message))
  }
})
