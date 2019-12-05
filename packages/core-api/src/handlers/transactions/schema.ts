import { app } from "@arkecosystem/core-container";
import Joi from "@hapi/joi";
import { address, blockId, orderBy, pagination, publicKey } from "../shared/schemas";

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy,
            id: Joi.string()
                .hex()
                .length(64),
            blockId,
            type: Joi.number()
                .integer()
                .min(0),
            typeGroup: Joi.number()
                .integer()
                .min(0),
            version: Joi.number()
                .integer()
                .positive(),
            senderPublicKey: publicKey,
            senderId: address,
            recipientId: address,
            timestamp: Joi.number()
                .integer()
                .min(0),
            nonce: Joi.number()
                .integer()
                .min(0),
            amount: Joi.number()
                .integer()
                .min(0),
            fee: Joi.number()
                .integer()
                .min(0),
            vendorField: Joi.string().max(255, "utf8"),
            transform: Joi.bool().default(true),
        },
    },
};

export const store: object = {
    type: "object",
    required: ["transactions"],
    additionalProperties: false,
    properties: {
        transactions: {
            $ref: "transactions",
            minItems: 1,
            maxItems: app.resolveOptions("transaction-pool").maxTransactionsPerRequest,
        },
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
    query: {
        transform: Joi.bool().default(true),
    },
};

export const unconfirmed: object = {
    query: {
        ...pagination,
        ...{
            transform: Joi.bool().default(true),
        },
    },
};

/**
 * Create a function that would validate a given JOI object and if validation
 * fails, then throw an error that includes the input value.
 * See https://hapi.dev/api/?v=18.4.0#-routeoptionsvalidateparams
 */
function createValidatorFunc(joiObject: any) {
    return async function(input, options) {
        const schema = Joi.object(joiObject);
        // https://hapi.dev/family/joi/?v=16.1.8#general-usage
        const { error, value } = schema.validate(input);
        if (error) {
            const message = error.details
                .map(d => `${d.message}: key=${d.context.key}, value=${d.context.value}`)
                .join("; ");
            throw new Error(message);
        }
        return value;
    }
}

/**
 * Replace each property of a given object with the result of calling createValidatorFunc().
 * This is used so that we could still use e.g. { params: { id: Joi... } } and have the
 * input value included in the error message.
 */
function transformValidationObject(obj) {
    for (const key of Object.keys(obj)) {
        obj[key] = createValidatorFunc(obj[key]);
    }
    return obj;
}

export const showUnconfirmed: object = transformValidationObject({
    params: {
        id: Joi.string()
            .hex()
            .length(64),
    },
});

export const search: object = {
    query: {
        ...pagination,
        ...{
            transform: Joi.bool().default(true),
        },
    },
    payload: {
        orderBy,
        id: Joi.string()
            .hex()
            .length(64),
        blockId,
        type: Joi.number()
            .integer()
            .min(0),
        typeGroup: Joi.number()
            .integer()
            .min(0),
        version: Joi.number()
            .integer()
            .positive(),
        senderPublicKey: publicKey,
        senderId: address,
        recipientId: address,
        addresses: Joi.array()
            .unique()
            .min(1)
            .max(50)
            .items(address),
        vendorField: Joi.string().max(255, "utf8"),
        timestamp: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        nonce: Joi.number()
            .integer()
            .min(0),
        amount: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        fee: Joi.object().keys({
            from: Joi.number()
                .integer()
                .min(0),
            to: Joi.number()
                .integer()
                .min(0),
        }),
        asset: Joi.object(),
    },
};
