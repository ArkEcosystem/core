'use strict'

const _ = require('lodash')
const fs = require('fs-extra')

exports.logger = require('./logger')

/**
 * Update the contents of the given file.
 * @param  {String} file
 * @param  {Object} overwrites
 * @return {void}
 */
exports.updateConfig = async (file, overwrites) => {
  const configPath = `${process.env.ARK_PATH_CONFIG}/deployer/${file}.json`
  let config
  if (fs.existsSync(configPath)) {
    config = require(configPath)
  } else {
    config = {}
  }

  for (let key in overwrites) {
    _.set(config, key, overwrites[key])
  }

  fs.ensureFileSync(configPath)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}
