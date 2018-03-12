const fs = require('fs')

exports.readConfig = (file) => require(file)

exports.writeConfig = (file, data) => fs.writeFile(file, JSON.stringify(data))
