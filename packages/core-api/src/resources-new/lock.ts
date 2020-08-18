import { Contracts } from "@arkecosystem/core-kernel";
import { Enums, Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import * as Schemas from "../schemas";
import { transactionCriteriaSchemaObject, transactionIdSchema } from "./transaction";

export type LockCriteria = Contracts.Search.StandardCriteriaOf<LockResource>;

export type LockResource = {
    lockId: string;
    senderPublicKey: string;
    isExpired: boolean;
    amount: Utils.BigNumber;
    secretHash: string;
    recipientId: string;
    timestamp: number;
    expirationType: Enums.HtlcLockExpirationType;
    expirationValue: number;
    vendorField: string;
};

export const lockIdSchema = transactionIdSchema;

export const lockCriteriaSchemaObject = {
    lockId: transactionCriteriaSchemaObject.id,
    senderPublicKey: transactionCriteriaSchemaObject.senderPublicKey,
    isExpired: Joi.boolean(),
    amount: Joi.alternatives(
        Schemas.bigNumber,
        Joi.object({ from: Schemas.bigNumber, to: Schemas.bigNumber }).or("from", "to"),
    ),
    secretHash: Joi.alternatives(
        Joi.string().hex().length(64),
        Joi.string()
            .regex(/^[0-9a-z%]{1,64}$/)
            .regex(/%/),
    ),
    recipientId: transactionCriteriaSchemaObject.recipientId,
    timestamp: Joi.alternatives(
        Joi.number().min(0),
        Joi.object({ from: Joi.number().min(0), to: Joi.number().min(0) }).or("from", "to"),
    ),
    expirationType: Joi.number().allow(
        Enums.HtlcLockExpirationType.BlockHeight,
        Enums.HtlcLockExpirationType.EpochTimestamp,
    ),
    expirationValue: Joi.alternatives(
        Joi.number().min(0),
        Joi.object({ from: Joi.number().min(0), to: Joi.number().min(0) }).or("from", "to"),
    ),
    vendorField: transactionCriteriaSchemaObject.vendorField,
};

export const lockCriteriaSchema = Schemas.createCriteriaSchema(lockCriteriaSchemaObject);
