import Joi from "joi";

import { walletCriteriaSchemaObject } from "./wallet";

export const transactionIdSchema = Joi.string().hex().length(64);

export const transactionCriteriaSchemaObject = {
    id: Joi.alternatives(
        transactionIdSchema,
        Joi.string()
            .regex(/^[0-9a-z%]{1,64}$/)
            .regex(/%/),
    ),
    senderPublicKey: walletCriteriaSchemaObject.publicKey,
    recipientId: walletCriteriaSchemaObject.address,
    vendorField: Joi.string().max(256),
};

export const transactionParamSchema = transactionIdSchema;
