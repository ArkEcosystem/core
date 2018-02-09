const axios = require('axios')

module.exports = (webhook, payload) => {
  return axios.post(webhook.options.hook.url, {
    formParams: payload,
    headers: { 'X-Hook-Secret': webhook.options.hook.authToken }
  })
}
