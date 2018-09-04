const QueryFile = require('pg-promise').QueryFile
const path = require('path')

module.exports = {
  models: {
    block: require('./models/block'),
    transaction: require('./models/transaction'),
    wallet: require('./models/wallet'),
  },
  migrations: [
    sql('migrations/20180305100000-create-wallets-table.sql'),
    sql('migrations/20180305200000-create-rounds-table.sql'),
    sql('migrations/20180305300000-create-blocks-table.sql'),
    sql('migrations/20180305400000-create-transactions-table.sql'),
    sql('migrations/20180305500000-create-count_estimate-function.sql'),
  ],
  queries: {
    blocks: {
      count: sql('queries/blocks/count.sql'),
      findById: sql('queries/blocks/find-by-id.sql'),
      headers: sql('queries/blocks/headers.sql'),
      heightRange: sql('queries/blocks/height-range.sql'),
      latest: sql('queries/blocks/latest.sql'),
      recent: sql('queries/blocks/recent.sql'),
      statistics: sql('queries/blocks/statistics.sql'),
    },
    rounds: {
      delete: sql('queries/rounds/delete.sql'),
      find: sql('queries/rounds/find.sql')
    },
    spv: {
      blockRewards: sql('queries/spv/block-rewards.sql'),
      delegates: sql('queries/spv/delegates.sql'),
      delegatesForgedBlocks: sql('queries/spv/delegates-forged-blocks.sql'),
      delegatesRanks: sql('queries/spv/delegates-ranks.sql'),
      lastForgedBlocks: sql('queries/spv/last-forged-blocks.sql'),
      multiSignatures: sql('queries/spv/multi-signatures.sql'),
      receivedTransactions: sql('queries/spv/received-transactions.sql'),
      secondSignatures: sql('queries/spv/second-signatures.sql'),
      sentTransactions: sql('queries/spv/sent-transactions.sql'),
      votes: sql('queries/spv/votes.sql')
    },
    transactions: {
      findByBlock: sql('queries/transactions/find-by-block.sql'),
      latestByBlock: sql('queries/transactions/latest-by-block.sql'),
      latestByBlocks: sql('queries/transactions/latest-by-blocks.sql'),
      statistics: sql('queries/transactions/statistics.sql')
    },
    wallets: {
      all: sql('queries/wallets/all.sql'),
      roundDelegates: sql('queries/wallets/round-delegates.sql'),
      roundFillers: sql('queries/wallets/round-fillers.sql'),
      roundFillersExcept: sql('queries/wallets/round-fillers-except.sql'),
      truncate: sql('queries/wallets/truncate.sql')
    }
  }
}

function sql (file) {
  const fullPath = path.join(__dirname, file)

  const options = {
    minify: true,
    params: {
      schema: 'public'
    }
  }

  const query = new QueryFile(fullPath, options)

  if (query.error) {
    console.error(query.error)
  }

  return query
}
