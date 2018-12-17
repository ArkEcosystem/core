import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const ipfs = joi => ({
    name: "arkIpfs",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TransactionTypes.Ipfs)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().valid(0))
            .optional(),
        asset: joi.object().required(),
        recipientId: joi.empty(),
    }),
});
