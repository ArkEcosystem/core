module.exports = joi => ({
  name: 'phantomTransactions',
  base: joi
    .array()
    .items(
      joi
        .alternatives()
        .try(
          joi.phantomTransfer(),
          joi.phantomSecondSignature(),
          joi.phantomDelegateRegistration(),
          joi.phantomVote(),
          joi.phantomMultiSignature(),
        ),
    ),
})
