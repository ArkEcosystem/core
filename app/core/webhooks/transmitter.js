const axios = require('axios')

module.exports = (webhook, payload) => {
  return axios.post(webhook.target, {
    formParams: payload,
    headers: { 'X-Hook-Secret': webhook.options.secret }
  })
}
