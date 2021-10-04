import Joi from "joi";

export const consensusSchemas = {
    createBlockProposal: Joi.object({
        hash: Joi.string().hex().length(64).required(),
        height: Joi.number().integer().positive().required(),
        generatorPublicKey: Joi.string().hex().length(66).required(),
        signature: Joi.string().hex().required(), // TODO: add length
        timestamp: Joi.number().integer().positive().required(),
        payload: Joi.any().required(), // TODO
    }).required(),
};
