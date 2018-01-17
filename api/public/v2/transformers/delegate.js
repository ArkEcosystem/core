module.exports = (model) => {
  return {
    username: model.username,
    address: model.address,
    public_key: model.publicKey,
    votes: model.votes,
    rank: model.rank,
    blocks: {
      produced: model.producedblocks,
      missed: model.missedblocks
      // last: {
      //   id: model.lastBlock.id,
      //   created_at: model.lastBlock.createdAt,
      // },
    },
    production: {
      approval: model.approval,
      productivity: model.productivity
    }
  }
}
