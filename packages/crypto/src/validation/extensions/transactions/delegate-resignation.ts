import { TRANSACTION_TYPES } from "../../../constants";
import { base as transaction } from "./base";

export const delegateResignation = joi => ({
    name: "arkDelegateResignation",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TRANSACTION_TYPES.DELEGATE_RESIGNATION)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().valid(0))
            .optional(),
        asset: joi.object().required(),
        recipientId: joi.empty(),
    }),
});
