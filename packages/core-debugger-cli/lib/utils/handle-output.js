const copyToClipboard = require('../utils/copy-to-clipboard')

module.exports = (opts, data) => {
  if (opts.copy) {
    return copyToClipboard(data)
  }

  if (opts.log) {
    return console.info(data)
  }

  return data
}
