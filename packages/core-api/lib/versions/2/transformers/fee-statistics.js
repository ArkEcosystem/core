/**
 * Turns a "fee-statistics" object into readable object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => ({
  type: model.type,
  fees: {
    minFee: parseInt(model.minFee),
    maxFee: parseInt(model.maxFee),
    avgFee: parseInt(model.avgFee),
  },
})
