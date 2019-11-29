import Joi from "@hapi/joi";

export const orderBy = Joi.string().regex(
    /^[a-z._]{1,40}:(asc|desc)$/i,
    "orderBy query parameter (<iteratee>:<direction>)",
);
