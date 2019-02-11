import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

export const multiSignature = joi => ({
    name: "multiSignature",
    base: transaction(joi).append({
        type: joi
            .number()
            .only(TransactionTypes.MultiSignature)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().only(0))
            .optional(),
        recipientId: joi.empty(),
        signatures: joi
            .array()
            .length(joi.ref("asset.multisignature.keysgroup.length"))
            .required(),
        asset: joi
            .object({
                multisignature: joi
                    .object({
                        min: joi
                            .when(joi.ref("keysgroup.length"), {
                                is: joi.number().greater(16),
                                then: joi
                                    .number()
                                    .positive()
                                    .max(16),
                                otherwise: joi
                                    .number()
                                    .positive()
                                    .max(joi.ref("keysgroup.length")),
                            })
                            .required(),
                        keysgroup: joi
                            .array()
                            .unique()
                            .min(2)
                            .items(
                                joi
                                    .string()
                                    .not(`+${(transaction as any).senderPublicKey}`)
                                    .length(67)
                                    .regex(/^\+/)
                                    .required(),
                            )
                            .required(),
                        lifetime: joi
                            .number()
                            .integer()
                            .min(1)
                            .max(72)
                            .required(),
                    })
                    .required(),
            })
            .required(),
    }),
});
