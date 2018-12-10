export const transactionArray = joi => ({
    name: "arkTransactionArray",
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
});
