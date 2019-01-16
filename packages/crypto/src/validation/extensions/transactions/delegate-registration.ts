import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const delegateRegistration = joi => ({
    name: "delegateRegistration",
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
                        username: joi.delegateUsername().required(),
                        publicKey: joi.publicKey(),
                    })
                    .required(),
            })
            .required(),
        recipientId: joi.empty(),
    }),
});
