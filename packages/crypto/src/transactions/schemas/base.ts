import * as Joi from "joi";
import { configManager } from "../../managers";

import { schemas } from "../../validation/extensions";

const joi = Joi.extend(Object.values(schemas));

// TODO: cleanup schema in 2.5
export const base = joi.object().keys({
    id: joi
        .string()
        .alphanum()
        .required(),
    blockid: Joi.alternatives().try(joi.blockId(), joi.number().unsafe()),
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
    senderId: joi.address(),
    recipientId: joi.address().required(),
    senderPublicKey: joi.publicKey().required(),
    signature: joi
        .string()
        .alphanum()
        .required(),
    signatures: joi.array(),
    secondSignature: joi.string().alphanum(),
    signSignature: joi.string().alphanum(),
    confirmations: joi
        .number()
        .integer()
        .min(0),
});
