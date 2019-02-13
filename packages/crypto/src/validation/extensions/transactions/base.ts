import { configManager } from "../../../managers";

export const base = joi =>
    joi.object().keys({
        id: joi
            .string()
            .alphanum()
            .required(),
        blockid: joi.alternatives().try(
            // TODO: remove in 2.1
            joi.blockId(),
            // @ts-ignore
            joi.number().unsafe(),
        ),
        network: joi.lazy(
            () =>
                joi
                    .number()
                    .only(configManager.get("pubKeyHash"))
                    .optional(),
            { once: false },
        ),
        version: joi
            .number()
            .integer()
            .min(1)
            .max(2)
            .optional(),
        timestamp: joi
            .number()
            .integer()
            .min(0)
            .required(),
        amount: joi
            .alternatives()
            .try(
                joi
                    .bignumber()
                    .integer()
                    .positive(),
                joi
                    .number()
                    .integer()
                    .positive(),
            )
            .required(),
        fee: joi
            .alternatives()
            .try(
                joi
                    .bignumber()
                    .integer()
                    .positive(),
                joi
                    .number()
                    .integer()
                    .positive(),
            )
            .required(),
        senderId: joi.address(), // TODO: remove in 2.1
        recipientId: joi.address().required(),
        senderPublicKey: joi.publicKey().required(),
        signature: joi
            .string()
            .alphanum()
            .required(),
        secondSignature: joi.string().alphanum(),
        signSignature: joi.string().alphanum(), // TODO: remove in 2.1
        confirmations: joi // TODO: remove in 2.1
            .number()
            .integer()
            .min(0),
    });
