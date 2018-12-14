import { TRANSACTION_TYPES } from "../../../../constants";
import { Engine } from "../../../engine";

export const secondSignature = transaction => {
    const { error, value } = Engine.validate(
        transaction,
        Engine.joi.object({
            id: Engine.joi
                .string()
                .alphanum()
                .required(),
            // @ts-ignore
            blockid: Engine.joi.alternatives().try(Engine.joi.arkBlockId(), Engine.joi.number().unsafe()),
            type: Engine.joi.number().valid(TRANSACTION_TYPES.SECOND_SIGNATURE),
            timestamp: Engine.joi
                .number()
                .integer()
                .min(0)
                .required(),
            amount: Engine.joi.alternatives().try(Engine.joi.bignumber(), Engine.joi.number().valid(0)),
            fee: Engine.joi.alternatives().try(
                Engine.joi.bignumber(),
                Engine.joi
                    .number()
                    .integer()
                    .positive()
                    .required(),
            ),
            senderId: Engine.joi.arkAddress(),
            senderPublicKey: Engine.joi.arkPublicKey().required(),
            signature: Engine.joi
                .string()
                .alphanum()
                .required(),
            signatures: Engine.joi.array(),
            secondSignature: Engine.joi.empty(),
            asset: Engine.joi
                .object({
                    signature: Engine.joi
                        .object({
                            publicKey: Engine.joi.arkPublicKey().required(),
                        })
                        .required(),
                })
                .required(),
            confirmations: Engine.joi
                .number()
                .integer()
                .min(0),
        }),
        {
            allowUnknown: true,
        },
    );

    return {
        data: value,
        errors: error ? error.details : null,
        passes: !error,
        fails: error,
    };
};
