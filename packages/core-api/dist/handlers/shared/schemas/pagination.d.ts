import Joi from "@hapi/joi";
export declare const pagination: {
    page: Joi.NumberSchema;
    offset: Joi.NumberSchema;
    limit: Joi.NumberSchema;
};
