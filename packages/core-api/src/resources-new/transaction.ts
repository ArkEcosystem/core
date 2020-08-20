import Joi from "@hapi/joi";

import { blockCriteriaSchemaObject } from "./block";
import { walletCriteriaSchemaObject } from "./wallet";

export const transactionIdSchema = Joi.string().hex().length(64);
export const transactionParamSchema = transactionIdSchema;

export const transactionCriteriaSchemaObject = {
    id: Joi.alternatives(
        transactionIdSchema,
        Joi.string()
            .regex(/^[0-9a-z%]{1,64}$/)
            .regex(/%/),
    ),
    timestamp: blockCriteriaSchemaObject.timestamp,
    senderPublicKey: walletCriteriaSchemaObject.publicKey,
    recipientId: walletCriteriaSchemaObject.address,
    vendorField: Joi.string().max(256),
};
