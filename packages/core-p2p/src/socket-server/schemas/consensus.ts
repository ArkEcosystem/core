import Joi from "joi";

import { headers } from "./shared";

export const consensusSchemas = {
    createBlockProposal: Joi.object({
        blockHash: Joi.string().hex().length(64).required(),
        height: Joi.number().integer().positive().required(),
        generatorPublicKey: Joi.string().hex().length(66).required(),
        signature: Joi.string().hex().required(), // TODO: add length
        timestamp: Joi.number().integer().positive().required(),
        payload: Joi.object({
            version: Joi.number().integer().min(0).required(),
            generatorPublicKey: Joi.string().hex().length(66).required(),
            timestamp: Joi.number().integer().positive().required(),
            previousBlock: Joi.string().hex().required(), // TODO: add length
            height: Joi.number().integer().positive().required(),
            numberOfTransactions: Joi.number().integer().min(0).required(),
            totalAmount: Joi.required(), // TODO bigNumber
            totalFee: Joi.required(), // TODO bigNumber
            reward: Joi.required(), // TODO bigNumber
            payloadLength: Joi.number().integer().positive().required(),
            payloadHash: Joi.string().hex().required(), // TODO: add length
            transactions: Joi.array().items(Joi.binary()), // TODO: add max items
            signatures: Joi.array().items(Joi.string()), // TODO: add max items, hex
        }).required(),
        headers,
    }).required(),
};
