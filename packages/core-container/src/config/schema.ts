import Joi from "joi";

export const schemaNetwork = Joi.object({
    milestones: Joi.array()
        .items(Joi.object())
        .required(),
    exceptions: Joi.object({
        blocks: Joi.array().items(Joi.string()),
        transactions: Joi.array().items(Joi.string()),
        outlookTable: Joi.object(),
        transactionIdFixTable: Joi.object(),
    }).default({ exceptions: {} }),
    genesisBlock: Joi.object().required(),
    network: Joi.object({
        name: Joi.string().required(),
        messagePrefix: Joi.string().required(),
        bip32: Joi.object({
            public: Joi.number()
                .positive()
                .required(),
            private: Joi.number()
                .positive()
                .required(),
        }),
        pubKeyHash: Joi.number()
            .positive()
            .required(),
        nethash: Joi.string()
            .hex()
            .required(),
        slip44: Joi.number().positive(),
        wif: Joi.number()
            .positive()
            .required(),
        aip20: Joi.number().required(),
        client: Joi.object({
            token: Joi.string().required(),
            symbol: Joi.string().required(),
            explorer: Joi.string().required(),
        }),
    }).required(),
});

export const schemaConfig = Joi.object({
    delegates: Joi.object({
        secrets: Joi.array().items(Joi.string()),
        bip38: Joi.string(),
    }),
    peers: Joi.object().required(),
    plugins: Joi.object().required(),
}).unknown();
