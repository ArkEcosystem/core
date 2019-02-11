import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const timelockTransfer = joi => ({
    name: "timelockTransfer",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TransactionTypes.MultiPayment)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().only(0))
            .optional(),
        asset: joi.object().required(),
        vendorFieldHex: joi
            .string()
            .max(64, "hex")
            .optional(),
        vendorField: joi
            .string()
            .max(64, "utf8")
            .allow("", null)
            .optional(), // TODO: remove in 2.1
        recipientId: joi.empty(),
    }),
});
