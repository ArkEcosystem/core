'use strict'

module.exports = {
  version: '2.0.0',
  fastRebuild: false,
  databaseRollback: {
    maxBlockRewind: 10000,
    steps: 1000
  },
  state: {
    maxLastBlocks: 100
  }
}
