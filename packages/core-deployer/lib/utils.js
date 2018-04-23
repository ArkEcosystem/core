'use strict';

const _ = require('lodash')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)

/**
 * [description]
 * @param  {[type]} file       [description]
 * @param  {[type]} overwrites [description]
 * @return {[type]}            [description]
 */
exports.updateConfig = async (file, overwrites) => {
  let config = require(`${process.env.ARK_CONFIG}/${file}.json`)

  for (let key in overwrites) {
    _.set(config, key, overwrites[key])
  }

  writeFile(`${process.env.ARK_CONFIG}/${file}.json`, JSON.stringify(config, null, 2))
}
