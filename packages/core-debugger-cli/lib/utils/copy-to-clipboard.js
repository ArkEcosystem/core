const clipboardy = require('clipboardy')

module.exports = data => clipboardy.writeSync(JSON.stringify(data))
