import { TransactionTypes } from "../../../../constants";
import { Engine } from "../../../engine";

export const delegateRegistration = transaction => {
    const { error, value } = Engine.validate(
        transaction,
        Engine.joi.object({
            id: Engine.joi
                .string()
                .alphanum()
                .required(),
            // @ts-ignore
            blockid: Engine.joi.alternatives().try(Engine.joi.blockId(), Engine.joi.number().unsafe()),
            type: Engine.joi.number().valid(TransactionTypes.DelegateRegistration),
            timestamp: Engine.joi
                .number()
                .integer()
                .min(0)
                .required(),
            amount: Engine.joi.alternatives().try(
                Engine.joi.bignumber(),
                Engine.joi
                    .number()
                    .valid(0)
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
            senderId: Engine.joi.address(),
            recipientId: Engine.joi.empty(),
            senderPublicKey: Engine.joi.publicKey().required(),
            signature: Engine.joi
                .string()
                .alphanum()
                .required(),
            signatures: Engine.joi.array(),
            secondSignature: Engine.joi.string().alphanum(),
            asset: Engine.joi
                .object({
                    delegate: Engine.joi
                        .object({
                            username: Engine.joi.delegateUsername().required(),
                            publicKey: Engine.joi.publicKey(),
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
