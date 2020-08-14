import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import { bigNumberSchema, createRangeCriteriaQuerySchema, nonNegativeBigNumberSchema } from "../schemas";

export type WalletCriteria = Contracts.Search.StandardCriteriaOf<WalletResource>;

export type WalletResource = {
    address: string;
    publicKey?: string;
    balance: Utils.BigNumber;
    nonce: Utils.BigNumber;
    attributes: object;
};

const walletAddressParamSchema = Joi.string().alphanum().length(34);
const walletPublicKeyParamSchema = Joi.string().hex().length(66);
const walletUsernameParamSchema = Joi.string().max(256);

export const walletIdParamSchema = Joi.alternatives(
    walletAddressParamSchema,
    walletPublicKeyParamSchema,
    walletUsernameParamSchema,
);

const walletAddressLikeCriteriaItemSchema = Joi.alternatives(
    walletAddressParamSchema,
    Joi.string()
        .regex(/^[0-9A-Za-z%]{1,34}$/)
        .regex(/%/),
);

const walletPublicKeyLikeCriteriaItemSchema = Joi.alternatives(
    walletPublicKeyParamSchema,
    Joi.string()
        .regex(/^[0-9a-z%]{1,66}$/)
        .regex(/%/),
);

export const walletCriteriaQuerySchema = Joi.object({
    address: walletAddressLikeCriteriaItemSchema,
    publicKey: walletPublicKeyLikeCriteriaItemSchema,
})
    .concat(createRangeCriteriaQuerySchema("balance", bigNumberSchema))
    .concat(createRangeCriteriaQuerySchema("nonce", nonNegativeBigNumberSchema))
    .pattern(/^attributes\./, Joi.any());

const walletBalanceCriteriaPayloadSchema = Joi.alternatives(
    bigNumberSchema,
    Joi.object({ from: bigNumberSchema, to: bigNumberSchema }).or("from", "to"),
);

const walletNonceCriteriaPayloadSchema = Joi.alternatives(
    nonNegativeBigNumberSchema,
    Joi.object({ from: nonNegativeBigNumberSchema, to: nonNegativeBigNumberSchema }).or("from", "to"),
);

const walletCriteriaPayloadItemSchema = Joi.object({
    address: Joi.alternatives(
        walletAddressLikeCriteriaItemSchema,
        Joi.array().items(walletAddressLikeCriteriaItemSchema),
    ),
    publicKey: Joi.alternatives(
        walletPublicKeyLikeCriteriaItemSchema,
        Joi.array().items(walletPublicKeyLikeCriteriaItemSchema),
    ),
    balance: Joi.alternatives(
        walletBalanceCriteriaPayloadSchema,
        Joi.array().items(walletBalanceCriteriaPayloadSchema),
    ),
    nonce: Joi.alternatives(walletNonceCriteriaPayloadSchema, Joi.array().items(walletNonceCriteriaPayloadSchema)),
    attributes: Joi.object(),
}).unknown(false);

export const walletCriteriaPayloadSchema = Joi.alternatives(
    walletCriteriaPayloadItemSchema,
    Joi.array().items(walletCriteriaPayloadItemSchema),
);
