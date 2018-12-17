import Joi from "joi";

export const schemaNetwork = Joi.object({
    dynamicFees: Joi.object({
        enabled: Joi.boolean().required(),
        minFeePool: Joi.number()
            .integer()
            .positive()
            .required(),
        minFeeBroadcast: Joi.number()
            .integer()
            .positive()
            .required(),
        addonBytes: Joi.object()
            .keys({
                transfer: Joi.number()
                    .integer()
                    .required(),
                secondSignature: Joi.number()
                    .integer()
                    .required(),
                delegateRegistration: Joi.number()
                    .integer()
                    .required(),
                vote: Joi.number()
                    .integer()
                    .required(),
                multiSignature: Joi.number()
                    .integer()
                    .required(),
                ipfs: Joi.number()
                    .integer()
                    .required(),
                timelockTransfer: Joi.number()
                    .integer()
                    .required(),
                multiPayment: Joi.number()
                    .integer()
                    .required(),
                delegateResignation: Joi.number()
                    .integer()
                    .required(),
            })
            .required(),
    }).required(),
    milestones: Joi.array()
        .items(Joi.object())
        .required(),
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
        wif: Joi.number()
            .positive()
            .required(),
        aip20: Joi.number().required(),
        client: Joi.object({
            token: Joi.string().required(),
            symbol: Joi.string().required(),
            explorer: Joi.string().required(),
        }),
        exceptions: Joi.object({
            blocks: Joi.array().items(Joi.string()),
            transactions: Joi.array().items(Joi.string()),
        }).required(),
        outlookTable: Joi.object(),
        transactionIdFixTable: Joi.object(),
    }).required(),
});

export const schemaConfig = Joi.object({
    delegates: Joi.object({
        secrets: Joi.array().items(Joi.string()),
        bip38: Joi.string(),
    }),
    peers: Joi.object().required(),
    peers_backup: Joi.array().items(
        Joi.object().keys({
            ip: Joi.string()
                .ip()
                .required(),
            port: Joi.number()
                .port()
                .required(),
            version: Joi.string().required(),
        }),
    ),
    plugins: Joi.object().required(),
    genesisBlock: Joi.object().required(),
});
