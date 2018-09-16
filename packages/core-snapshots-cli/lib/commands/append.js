'use strict'

const zlib = require('zlib')
const fs = require('fs-extra')

module.exports = async (options) => {
  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`

  await fs.ensureFile(`${storageLocation}/snapshot.dat`)
  fs.createReadStream(`${storageLocation}/${options.filename}`)
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream(`${storageLocation}/snapshot.dat`))
    .on('finish', async () => {
      require('./create')(options)
    })
}
