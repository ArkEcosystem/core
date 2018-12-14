import { TRANSACTION_TYPES } from "../../../../constants";
import { Engine } from "../../../engine";

export const transfer = transaction => {
    const { error, value } = Engine.validate(
        transaction,
        Engine.joi.object({
            id: Engine.joi
                .string()
                .alphanum()
                .required(),
            // @ts-ignore
            blockid: Engine.joi.alternatives().try(Engine.joi.arkBlockId(), Engine.joi.number().unsafe()),
            type: Engine.joi.number().valid(TRANSACTION_TYPES.TRANSFER),
            timestamp: Engine.joi
                .number()
                .integer()
                .min(0)
                .required(),
            amount: Engine.joi.alternatives().try(
                Engine.joi.bignumber(),
                Engine.joi
                    .number()
                    .integer()
                    .positive()
                    .required(),
            ),
            fee: Engine.joi.alternatives().try(
                Engine.joi.bignumber(),
                Engine.joi
                    .number()
                    .integer()
                    .positive()
                    .required(),
            ),
            senderId: Engine.joi.arkAddress(),
            recipientId: Engine.joi.arkAddress().required(),
            senderPublicKey: Engine.joi.arkPublicKey().required(),
            signature: Engine.joi
                .string()
                .alphanum()
                .required(),
            signatures: Engine.joi.array(),
            secondSignature: Engine.joi.string().alphanum(),
            vendorField: Engine.joi.string().max(64, "utf8"),
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
