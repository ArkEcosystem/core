const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

module.exports = (model) => {
  return {
    username: model.username,
    address: model.address,
    public_key: model.publicKey,
    votes: model.votes,
    rank: model.rank,
    blocks: {
      produced: model.producedBlocks,
      missed: model.missedBlocks
      // last: {
      //   id: model.lastBlock.id,
      //   created_at: model.lastBlock.createdAt,
      // },
    },
    production: {
      approval: calculateApproval(model),
      productivity: calculateProductivity(model)
    }
  }
}
