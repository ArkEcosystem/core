module.exports = {
  fastRebuild: false,
  databaseRollback: {
    maxBlockRewind: 10000,
    steps: 1000,
  },
  state: {
    maxLastBlocks: 100,
    maxLastTransactionIds: 10000,
  },
}
