const QueryFile = require('pg-promise').QueryFile
const path = require('path')

module.exports = {
  blocks: {
    findById: sql('blocks/find-by-id.sql'),
    heightRange: sql('blocks/height-range.sql'),
    latest: sql('blocks/latest.sql')
  },
  rounds: {
    delete: sql('rounds/delete.sql'),
    find: sql('rounds/find.sql')
  },
  spv: {
    blockRewards: sql('spv/block-rewards.sql'),
    delegates: sql('spv/delegates.sql'),
    delegatesForgedBlocks: sql('spv/delegates-forged-blocks.sql'),
    delegatesRanks: sql('spv/delegates-ranks.sql'),
    lastForgedBlocks: sql('spv/last-forged-blocks.sql'),
    multiSignatures: sql('spv/multi-signatures.sql'),
    receivedTransactions: sql('spv/received-transactions.sql'),
    secondSignatures: sql('spv/second-signatures.sql'),
    sentTransactions: sql('spv/sent-transactions.sql'),
    votes: sql('spv/votes.sql')
  },
  transactions: {
    findByBlock: sql('transactions/find-by-block.sql'),
    latestByBlock: sql('transactions/latest-by-block.sql'),
    latestByBlocks: sql('transactions/latest-by-blocks.sql')
  },
  wallets: {
    all: sql('wallets/all.sql'),
    roundDelegates: sql('wallets/round-delegates.sql'),
    roundFillersExcept: sql('wallets/round-fillers-except.sql'),
    roundFillers: sql('wallets/round-fillers.sql'),
    truncate: sql('wallets/truncate.sql')
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

  const qf = new QueryFile(fullPath, options)

  if (qf.error) {
    console.error(qf.error)
  }

  return qf
}
