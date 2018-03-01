const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

module.exports = (model) => {
  return {
    username: model.username,
    address: model.address,
    publicKey: model.publicKey,
    vote: model.vote,
    producedblocks: model.producedblocks,
    missedblocks: model.missedblocks,
    rate: model.rate,
    approval: calculateApproval(model),
    productivity: calculateProductivity(model)
  }
}
