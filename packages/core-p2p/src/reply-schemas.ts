import Joi from "joi";

export const replySchemas: any = {
    "/peer/blocks": Joi.object().keys({
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
    "/peer/blocks/common?ids=": Joi.object()
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
    "/peer/list": Joi.object()
        .keys({
            peers: Joi.array()
                .items(
                    Joi.object().keys({
                        ip: Joi.string()
                            .ip({ cidr: "forbidden" })
                            .required(),
                        status: [Joi.string(), Joi.number().integer()],
                    }),
                )
                .required(),
            success: Joi.boolean()
                .equal(true)
                .required(),
        })
        .required(),
    "/peer/status": Joi.object()
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
};
