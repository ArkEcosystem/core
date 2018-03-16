const _ = require('lodash')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)

exports.updateConfig = async (file, overwrites) => {
  let config = require(`${process.env.ARK_CONFIG}/${file}.json`)

  for (const [key, value] in overwrites) {
    _.set(config, key, value)
  }

  writeFile(`${process.env.ARK_CONFIG}/${file}.json`, JSON.stringify(config, null, 2))
}
