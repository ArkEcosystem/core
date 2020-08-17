import Joi from "@hapi/joi";

export const pagination = {
    page: Joi.number().integer().positive().default(1),
    offset: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1).default(100).max(Joi.ref("$configuration.plugins.pagination.limit")),
};

export const blockId = Joi.alternatives().try(
    Joi.string()
        .min(1)
        .max(20)
        .regex(/^[0-9]+$/, "decimal non-negative integer"),
    Joi.string().length(64).hex(),
);

export const address = Joi.string().alphanum().length(34);

export const delegateIdentifier = Joi.string()
    .regex(/^[a-zA-Z0-9!@$&_.]+$/)
    .min(1)
    .max(66);

export const username = Joi.string()
    .regex(/^[a-z0-9!@$&_.]+$/)
    .min(1)
    .max(20);

export const integerBetween = Joi.object().keys({
    from: Joi.number().integer().min(0),
    to: Joi.number().integer().min(0),
});

export const percentage = Joi.object().keys({
    from: Joi.number().precision(2).min(0).max(100),
    to: Joi.number().precision(2).min(0).max(100),
});

export const numberFixedOrBetween = Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.object().keys({
        from: Joi.number().integer().min(0),
        to: Joi.number().integer().min(0),
    }),
);

export const walletId = Joi.alternatives().try(
    Joi.string()
        .regex(/^[a-z0-9!@$&_.]+$/)
        .min(1)
        .max(20),
    Joi.string().alphanum().length(34),
    Joi.string().hex().length(66),
);

export const orderBy = Joi.string().regex(
    /^[a-z._]{1,40}:(asc|desc)$/i,
    "orderBy query parameter (<iteratee>:<direction>)",
);

export const blocksOrderBy = orderBy.default("height:desc");
export const transactionsOrderBy = orderBy.default("timestamp:desc,sequence:desc");

const equalCriteria = (value: any) => value;
const numericCriteria = (value: any) =>
    Joi.alternatives().try(
        value,
        Joi.object().keys({ from: value }),
        Joi.object().keys({ to: value }),
        Joi.object().keys({ from: value, to: value }),
    );
const likeCriteria = (value: any) => value;
const containsCriteria = (value: any) => value;
const orCriteria = (criteria: any) => Joi.alternatives().try(criteria, Joi.array().items(criteria));
const orEqualCriteria = (value: any) => orCriteria(equalCriteria(value));
const orNumericCriteria = (value: any) => orCriteria(numericCriteria(value));
const orLikeCriteria = (value: any) => orCriteria(likeCriteria(value));
const orContainsCriteria = (value: any) => orCriteria(containsCriteria(value));

export const blockCriteriaSchemas = {
    id: orEqualCriteria(blockId),
    version: orEqualCriteria(Joi.number().integer().min(0)),
    timestamp: orNumericCriteria(Joi.number().integer().min(0)),
    previousBlock: orEqualCriteria(blockId),
    height: orNumericCriteria(Joi.number().integer().min(0)),
    numberOfTransactions: orNumericCriteria(Joi.number().integer().min(0)),
    totalAmount: orNumericCriteria(Joi.number().integer().min(0)),
    totalFee: orNumericCriteria(Joi.number().integer().min(0)),
    reward: orNumericCriteria(Joi.number().integer().min(0)),
    payloadLength: orNumericCriteria(Joi.number().integer().min(0)),
    payloadHash: orEqualCriteria(Joi.string().hex()),
    generatorPublicKey: orEqualCriteria(Joi.string().hex().length(66)),
    blockSignature: orEqualCriteria(Joi.string().hex()),
};

export const transactionCriteriaSchemas = {
    address: orEqualCriteria(address),
    senderId: orEqualCriteria(address),
    recipientId: orEqualCriteria(address),
    id: orEqualCriteria(Joi.string().hex().length(64)),
    version: orEqualCriteria(Joi.number().integer().positive()),
    blockId: orEqualCriteria(blockId),
    sequence: orNumericCriteria(Joi.number().integer().positive()),
    timestamp: orNumericCriteria(Joi.number().integer().min(0)),
    nonce: orNumericCriteria(Joi.number().integer().positive()),
    senderPublicKey: orEqualCriteria(Joi.string().hex().length(66)),
    type: orEqualCriteria(Joi.number().integer().min(0)),
    typeGroup: orEqualCriteria(Joi.number().integer().min(0)),
    vendorField: orLikeCriteria(Joi.string().max(255, "utf8")),
    amount: orNumericCriteria(Joi.number().integer().min(0)),
    fee: orNumericCriteria(Joi.number().integer().min(0)),
    asset: orContainsCriteria(Joi.object()),
};
