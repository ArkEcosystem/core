module.exports = joi => ({
  name: 'arkTransactions',
  base: joi
    .array()
    .items(
      joi
        .alternatives()
        .try(
          joi.arkTransfer(),
          joi.arkSecondSignature(),
          joi.arkDelegateRegistration(),
          joi.arkVote(),
          joi.arkMultiSignature(),
        ),
    ),
})
