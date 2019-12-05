import { Enums } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";
import { lockIteratees, transactionIteratees } from "../shared/iteratees";
import { address, orderBy, pagination, publicKey } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(lockIteratees),
            recipientId: address,
            senderPublicKey: publicKey,
            lockId: Joi.string()
                .hex()
                .length(64),
            secretHash: Joi.string()
                .hex()
                .length(64),
            amount: Joi.number()
                .integer()
                .min(0),
            expirationValue: Joi.number()
                .integer()
                .min(0),
            expirationType: Joi.number().only(...Object.values(Enums.HtlcLockExpirationType)),
            isExpired: Joi.bool(),
        },
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
};

export const search: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(lockIteratees),
        },
    },
    payload: {
        recipientId: address,
        senderPublicKey: publicKey,
        lockId: Joi.string()
            .hex()
            .length(64),
        secretHash: Joi.string()
            .hex()
            .length(64),
        amount: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        timestamp: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        vendorField: Joi.string()
            .min(1)
            .max(255),
        expirationType: Joi.number().only(...Object.values(Enums.HtlcLockExpirationType)),
        expirationValue: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        isExpired: Joi.bool(),
    },
};

export const unlocked: object = {
    query: {
        ...pagination,
        ...{
            orderBy: orderBy(transactionIteratees),
        },
    },
    payload: {
        ids: Joi.array()
            .unique()
            .min(1)
            .max(25)
            .items(
                Joi.string()
                    .hex()
                    .length(64),
            ),
    },
};
