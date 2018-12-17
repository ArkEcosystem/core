import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const vote = joi => ({
    name: "arkVote",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TransactionTypes.Vote)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().only(0))
            .optional(),
        asset: joi
            .object({
                votes: joi
                    .array()
                    .items(
                        joi
                            .string()
                            .length(67)
                            .regex(/^(\+|-)[a-zA-Z0-9]+$/),
                    )
                    .length(1)
                    .required(),
            })
            .required(),
        recipientId: joi
            .arkAddress()
            .allow(null)
            .optional(),
    }),
});
