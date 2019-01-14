import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const secondSignature = joi => ({
    name: "secondSignature",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TransactionTypes.SecondSignature)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().only(0))
            .optional(),
        secondSignature: joi.string().only(""),
        asset: joi
            .object({
                signature: joi
                    .object({
                        publicKey: joi.publicKey().required(),
                    })
                    .required(),
            })
            .required(),
        recipientId: joi.empty(),
    }),
});
