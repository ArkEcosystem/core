'use strict'

const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')

/**
 * Get a random number from range.
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
exports.getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min)
}

exports.logger = require('./logger')

/**
 * Update the contents of the given file and return config.
 * @param  {String} file
 * @param  {Object} values
 * @return {Object}
 */
exports.updateConfig = (file, values, configPath, forceOverwrite) => {
  configPath = (configPath || `${process.env.ARK_PATH_CONFIG}/deployer`)
  configPath = path.resolve(configPath, `${file}.json`)
  let config
  if (fs.existsSync(configPath) && !forceOverwrite) {
    config = require(configPath)
  } else {
    config = {}
  }

  for (let key in values) {
    _.set(config, key, values[key])
  }

  fs.ensureFileSync(configPath)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

  return config
}
