export const transactionArray = joi => ({
    name: "transactionArray",
    base: joi
        .array()
        .items(
            joi
                .alternatives()
                .try(
                    joi.transfer(),
                    joi.secondSignature(),
                    joi.delegateRegistration(),
                    joi.vote(),
                    joi.multiSignature(),
                ),
        ),
});
