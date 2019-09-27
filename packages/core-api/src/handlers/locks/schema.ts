import Joi from "@hapi/joi";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
            recipientId: Joi.string()
                .alphanum()
                .length(34),
            senderPublicKey: Joi.string()
                .hex()
                .length(66),
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
            expirationType: Joi.number().only(1, 2),
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
            orderBy: Joi.string(),
        },
    },
    payload: {
        recipientId: Joi.string()
            .alphanum()
            .length(34),
        senderPublicKey: Joi.string()
            .hex()
            .length(66),
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
        expirationType: Joi.number().only(1, 2),
        expirationValue: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
    },
};
