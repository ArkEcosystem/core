const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)

exports.readConfig = (file) => require(`config/${process.env.NETWORK}/${file}.json`)

exports.writeConfig = async (file, data) => writeFile(`config/${process.env.NETWORK}/${file}.json`, JSON.stringify(data, null, 2))
