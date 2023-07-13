import Joi from "joi";

import * as Schemas from "../schemas";
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
export const transactionSortingSchema = Schemas.createSortingSchema(Schemas.transactionCriteriaSchemas, [], false);

export const transactionQueryLevelOptions = [
    { field: "version", asc: true, desc: true, allowSecondOrderBy: false, diverse: false },
    { field: "timestamp", asc: true, desc: true, allowSecondOrderBy: true, diverse: true },
    { field: "type", asc: true, desc: false, allowSecondOrderBy: false, diverse: false },
    { field: "amount", asc: true, desc: false, allowSecondOrderBy: false, diverse: false },
    { field: "fee", asc: true, desc: false, allowSecondOrderBy: false, diverse: false },
    { field: "typeGroup", asc: true, desc: true, allowSecondOrderBy: false, diverse: false },
    { field: "nonce", asc: true, desc: true, allowSecondOrderBy: false, diverse: false },
    { field: "id", asc: false, desc: false, allowSecondOrderBy: false, diverse: true },
    { field: "blockId", asc: false, desc: false, allowSecondOrderBy: false, diverse: true },
    { field: "senderPublicKey", asc: false, desc: false, allowSecondOrderBy: false, diverse: true },
    { field: "recipientId", asc: false, desc: false, allowSecondOrderBy: false, diverse: true },
    { field: "address", asc: false, desc: false, allowSecondOrderBy: false, diverse: true },
];
