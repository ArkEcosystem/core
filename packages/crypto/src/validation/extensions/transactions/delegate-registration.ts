import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const delegateRegistration = joi => ({
    name: "arkDelegateRegistration",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TransactionTypes.DelegateRegistration)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().only(0))
            .optional(),
        asset: joi
            .object({
                delegate: joi
                    .object({
                        username: joi.arkUsername().required(),
                        publicKey: joi.arkPublicKey(),
                    })
                    .required(),
            })
            .required(),
        recipientId: joi.empty(),
    }),
});
