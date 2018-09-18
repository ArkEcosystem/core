'use strict'
const zlib = require('zlib')
const init = require('../init')
const fs = require('fs-extra')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = (sourceFileName, height) => {
  const storageLocation = `${process.env.ARK_PATH_DATA}/snapshots/${process.env.ARK_NETWORK_NAME}`

  fs.createReadStream(`${storageLocation}/${sourceFileName}`)
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream(`${storageLocation}/snapshot.${height}.gz`))
    .on('finish', async () => {
      fs.unlinkSync(`${storageLocation}/${sourceFileName}`)
      logger.info(`New snapshot was succesfully created. File: [snapshot.${height}.gz]`)

      await init.tearDown()
    })
}
