class DelegateTransformer {
  constructor(model) {
    return {
      username: model.username,
      address: model.address,
      public_key: model.publicKey,
      votes: model.votes,
      rank: model.rank,
      blocks: {
        produced: model.producedblocks,
        missed: model.missedblocks,
        last: {
          id: models.lastBlock.id,
          created_at: models.lastBlock.created_at,
        },
      },
      production: {
        approval: model.approval,
        productivity: model.productivity,
      }
    };
  }
}

module.exports = DelegateTransformer
