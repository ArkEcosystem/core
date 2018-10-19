const { loadQueryFile } = require('../utils')

module.exports = {
  blocks: {
    common: loadQueryFile(__dirname, './blocks/common.sql'),
    count: loadQueryFile(__dirname, './blocks/count.sql'),
    delete: loadQueryFile(__dirname, './blocks/delete.sql'),
    findById: loadQueryFile(__dirname, './blocks/find-by-id.sql'),
    headers: loadQueryFile(__dirname, './blocks/headers.sql'),
    heightRange: loadQueryFile(__dirname, './blocks/height-range.sql'),
    latest: loadQueryFile(__dirname, './blocks/latest.sql'),
    recent: loadQueryFile(__dirname, './blocks/recent.sql'),
    statistics: loadQueryFile(__dirname, './blocks/statistics.sql'),
    top: loadQueryFile(__dirname, './blocks/top.sql')
  },
  rounds: {
    delete: loadQueryFile(__dirname, './rounds/delete.sql'),
    find: loadQueryFile(__dirname, './rounds/find.sql')
  },
  spv: {
    blockRewards: loadQueryFile(__dirname, './spv/block-rewards.sql'),
    delegates: loadQueryFile(__dirname, './spv/delegates.sql'),
    delegatesForgedBlocks: loadQueryFile(__dirname, './spv/delegates-forged-blocks.sql'),
    delegatesRanks: loadQueryFile(__dirname, './spv/delegates-ranks.sql'),
    lastForgedBlocks: loadQueryFile(__dirname, './spv/last-forged-blocks.sql'),
    multiSignatures: loadQueryFile(__dirname, './spv/multi-signatures.sql'),
    receivedTransactions: loadQueryFile(__dirname, './spv/received-transactions.sql'),
    secondSignatures: loadQueryFile(__dirname, './spv/second-signatures.sql'),
    sentTransactions: loadQueryFile(__dirname, './spv/sent-transactions.sql'),
    votes: loadQueryFile(__dirname, './spv/votes.sql')
  },
  transactions: {
    findByBlock: loadQueryFile(__dirname, './transactions/find-by-block.sql'),
    latestByBlock: loadQueryFile(__dirname, './transactions/latest-by-block.sql'),
    latestByBlocks: loadQueryFile(__dirname, './transactions/latest-by-blocks.sql'),
    statistics: loadQueryFile(__dirname, './transactions/statistics.sql'),
    forged: loadQueryFile(__dirname, './transactions/forged.sql'),
    findById: loadQueryFile(__dirname, './transactions/find-by-id.sql'),
    findManyById: loadQueryFile(__dirname, './transactions/find-many-by-id.sql'),
    deleteByBlock: loadQueryFile(__dirname, './transactions/delete-by-block.sql')
  },
  wallets: {
    all: loadQueryFile(__dirname, './wallets/all.sql'),
    findByAddress: loadQueryFile(__dirname, './wallets/find-by-address.sql'),
    findNegativeBalances: loadQueryFile(__dirname, './wallets/find-negative-balances.sql'),
    findNegativeVoteBalances: loadQueryFile(__dirname, './wallets/find-negative-vote-balances.sql')
  }
}
