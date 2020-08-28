import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import * as Schemas from "../schemas";

export type WalletCriteria = Contracts.Search.StandardCriteriaOf<WalletResource>;

export type WalletResource = {
    address: string;
    publicKey?: string;
    balance: Utils.BigNumber;
    nonce: Utils.BigNumber;
    attributes: object;
};

export const walletAddressSchema = Joi.string().alphanum().length(34);
export const walletPublicKeySchema = Joi.string().hex().length(66);
export const walletUsernameSchema = Joi.string().max(256);
export const walletParamSchema = Joi.alternatives(walletAddressSchema, walletPublicKeySchema, walletUsernameSchema);

export const walletCriteriaSchemaObject = {
    address: Joi.alternatives(
        walletAddressSchema,
        Joi.string()
            .regex(/^[0-9A-Za-z%]{1,34}$/)
            .regex(/%/),
    ),
    publicKey: Joi.alternatives(
        walletPublicKeySchema,
        Joi.string()
            .regex(/^[0-9a-z%]{1,66}$/)
            .regex(/%/),
    ),
    balance: Schemas.createRangeCriteriaSchema(Schemas.bigNumber),
    nonce: Schemas.createRangeCriteriaSchema(Schemas.nonNegativeBigNumber),
    attributes: Joi.object(),
};

export const walletCriteriaQuerySchema = Schemas.createCriteriaQuerySchema(walletCriteriaSchemaObject);
export const walletCriteriaPayloadSchema = Schemas.createCriteriaPayloadSchema(walletCriteriaSchemaObject);
export const walletSortingSchema = Schemas.createSortingSchema(walletCriteriaSchemaObject, ["attributes"]);
