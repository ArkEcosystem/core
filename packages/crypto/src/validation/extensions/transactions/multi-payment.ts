import { TRANSACTION_TYPES } from "../../../constants";
import { base as transaction } from "./base";

export const multiPayment = joi => ({
    name: "arkMultiPayment",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TRANSACTION_TYPES.MULTI_PAYMENT)
            .required(),
        asset: joi.object().required(),
        recipientId: joi.empty(),
    }),
});
