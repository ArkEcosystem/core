'use strict'

const zlib = require('zlib')
const fs = require('fs-extra')
const helpers = require('../helpers')

module.exports = async (options) => {
  await fs.ensureFile(`${helpers.getStoragePath()}/snapshot.dat`)
  fs.createReadStream(`${helpers.getStoragePath()}/${options.filename}`)
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream(`${helpers.getStoragePath()}/snapshot.dat`))
    .on('finish', async () => {
      require('./create')(options)
    })
}
