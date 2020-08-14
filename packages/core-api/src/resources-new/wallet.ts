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
