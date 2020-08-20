import { Contracts } from "@arkecosystem/core-kernel";
import { Enums, Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import * as Schemas from "../schemas";
import { blockCriteriaSchemaObject } from "./block";
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
export const lockParamSchema = lockIdSchema;

export const lockCriteriaSchemaObject = {
    lockId: transactionCriteriaSchemaObject.id,
    senderPublicKey: transactionCriteriaSchemaObject.senderPublicKey,
    isExpired: Joi.boolean(),
    amount: Schemas.createRangeCriteriaSchema(Schemas.bigNumber),
    secretHash: Joi.alternatives(
        Joi.string().hex().length(64),
        Joi.string()
            .regex(/^[0-9a-z%]{1,64}$/)
            .regex(/%/),
    ),
    recipientId: transactionCriteriaSchemaObject.recipientId,
    timestamp: transactionCriteriaSchemaObject.timestamp,
    expirationType: Joi.number().allow(
        Enums.HtlcLockExpirationType.BlockHeight,
        Enums.HtlcLockExpirationType.EpochTimestamp,
    ),
    expirationValue: Joi.alternatives(blockCriteriaSchemaObject.height, blockCriteriaSchemaObject.timestamp),
    vendorField: transactionCriteriaSchemaObject.vendorField,
};

export const lockCriteriaSchema = Schemas.createStandardCriteriaSchema(lockCriteriaSchemaObject);
