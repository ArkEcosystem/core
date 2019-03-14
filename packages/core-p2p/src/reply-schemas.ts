import Joi from "joi";

export const replySchemas: any = {
    "p2p.peer.getBlocks": Joi.object().keys({
        blocks: Joi.array()
            .items(
                Joi.object().keys({
                    height: Joi.number()
                        .integer()
                        .min(1)
                        .required(),
                    id: Joi.string()
                        .max(64)
                        .hex()
                        .required(),
                }),
            )
            .required(),
    }),
    "p2p.peer.getCommonBlocks": Joi.object()
        .keys({
            common: [
                Joi.object()
                    .keys({
                        height: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        id: Joi.string()
                            .max(64)
                            .hex()
                            .required(),
                    })
                    .required(),
                Joi.any().valid(null),
            ],
            success: Joi.boolean()
                .equal(true)
                .required(),
        })
        .required(),
    "p2p.peer.getPeers": Joi.object()
        .keys({
            peers: Joi.array()
                .items(
                    Joi.object().keys({
                        ip: Joi.string()
                            .ip({ cidr: "forbidden" })
                            .required(),
                    }),
                )
                .required(),
            success: Joi.boolean()
                .equal(true)
                .required(),
        })
        .required(),
    "p2p.peer.getStatus": Joi.object()
        .keys({
            header: Joi.object()
                .keys({
                    height: Joi.number()
                        .integer()
                        .min(1)
                        .required(),
                    id: Joi.string()
                        .max(64)
                        .hex()
                        .required(),
                })
                .required(),
            height: Joi.number()
                .integer()
                .min(1),
            success: Joi.boolean()
                .equal(true)
                .required(),
        })
        .required(),
    "p2p.peer.postBlock": Joi.object()
        .keys({
            success: Joi.boolean()
                .equal(true)
                .required(),
        })
        .required(),
    "p2p.peer.postTransactions": Joi.object()
        .keys({
            success: Joi.boolean()
                .equal(true)
                .required(),
        })
        .required(),
};
