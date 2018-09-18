'use strict'

const zlib = require('zlib')
const fs = require('fs-extra')
const utils = require('../utils')

module.exports = async (options) => {
  await fs.ensureFile(`${utils.getStoragePath()}/snapshot.dat`)
  fs.createReadStream(`${utils.getStoragePath()}/${options.filename}`)
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream(`${utils.getStoragePath()}/snapshot.dat`))
    .on('finish', async () => {
      require('./create')(options)
    })
}
