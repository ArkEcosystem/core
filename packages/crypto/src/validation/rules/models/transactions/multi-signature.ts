import { TransactionTypes } from "../../../../constants";
import { Engine } from "../../../engine";

export const multiSignature = transaction => {
    let maxMinValue = 16;
    let signaturesLength = 2;
    if (
        transaction.asset &&
        transaction.asset.multisignature &&
        Array.isArray(transaction.asset.multisignature.keysgroup)
    ) {
        maxMinValue = transaction.asset.multisignature.keysgroup.length;
        signaturesLength = maxMinValue;
    }
    const { error, value } = Engine.validate(
        transaction,
        Engine.joi.object({
            id: Engine.joi
                .string()
                .alphanum()
                .required(),
            // @ts-ignore
            blockid: Engine.joi.alternatives().try(Engine.joi.blockId(), Engine.joi.number().unsafe()),
            type: Engine.joi.number().valid(TransactionTypes.MultiSignature),
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
            senderId: Engine.joi.address(),
            recipientId: Engine.joi.empty(),
            senderPublicKey: Engine.joi.publicKey().required(),
            signature: Engine.joi
                .string()
                .alphanum()
                .required(),
            signatures: Engine.joi
                .array()
                .length(signaturesLength)
                .required(),
            secondSignature: Engine.joi.string().alphanum(),
            asset: Engine.joi
                .object({
                    multisignature: Engine.joi
                        .object({
                            min: Engine.joi
                                .number()
                                .integer()
                                .positive()
                                .max(Math.min(maxMinValue, 16))
                                .required(),
                            keysgroup: Engine.joi
                                .array()
                                .unique()
                                .min(2)
                                .items(
                                    Engine.joi
                                        .string()
                                        .not(`+${transaction.senderPublicKey}`)
                                        .length(67)
                                        .regex(/^\+/)
                                        .required(),
                                )
                                .required(),
                            lifetime: Engine.joi
                                .number()
                                .integer()
                                .min(1)
                                .max(72)
                                .required(),
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
