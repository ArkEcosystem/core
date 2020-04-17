import Joi from "@hapi/joi";

type SchemaSettings = {
    pagination: {
        limit: number;
    };
};

export const createSchemas = (settings: SchemaSettings) => {
    const pagination = {
        page: Joi.number().integer().positive().default(1),
        offset: Joi.number().integer().min(0),
        limit: Joi.number().integer().min(1).default(100).max(settings.pagination.limit),
    };

    const blockId = Joi.alternatives().try(
        Joi.string()
            .min(1)
            .max(20)
            .regex(/^[0-9]+$/, "decimal non-negative integer"),
        Joi.string().length(64).hex(),
    );

    const address = Joi.string().alphanum().length(34);

    const delegateIdentifier = Joi.string()
        .regex(/^[a-zA-Z0-9!@$&_.]+$/)
        .min(1)
        .max(66);

    const username = Joi.string()
        .regex(/^[a-z0-9!@$&_.]+$/)
        .min(1)
        .max(20);

    const integerBetween = Joi.object().keys({
        from: Joi.number().integer().min(0),
        to: Joi.number().integer().min(0),
    });

    const percentage = Joi.object().keys({
        from: Joi.number().precision(2).min(0).max(100),
        to: Joi.number().precision(2).min(0).max(100),
    });

    const numberFixedOrBetween = Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.object().keys({
            from: Joi.number().integer().min(0),
            to: Joi.number().integer().min(0),
        }),
    );

    const walletId = Joi.alternatives().try(
        Joi.string()
            .regex(/^[a-z0-9!@$&_.]+$/)
            .min(1)
            .max(20),
        Joi.string().alphanum().length(34),
        Joi.string().hex().length(66),
    );

    const orderBy = Joi.string().regex(
        /^[a-z._]{1,40}:(asc|desc)$/i,
        "orderBy query parameter (<iteratee>:<direction>)",
    );

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

    const blockCriteriaSchemas = {
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

    const transactionCriteriaSchemas = {
        senderId: orEqualCriteria(address),
        id: orEqualCriteria(Joi.string().hex().length(64)),
        version: orEqualCriteria(Joi.number().integer().positive()),
        blockId: orEqualCriteria(blockId),
        sequence: orNumericCriteria(Joi.number().integer().positive()),
        timestamp: orNumericCriteria(Joi.number().integer().min(0)),
        nonce: orNumericCriteria(Joi.number().integer().positive()),
        senderPublicKey: orEqualCriteria(Joi.string().hex().length(66)),
        recipientId: orEqualCriteria(address),
        type: orEqualCriteria(Joi.number().integer().min(0)),
        typeGroup: orEqualCriteria(Joi.number().integer().min(0)),
        vendorField: orLikeCriteria(Joi.string().max(255, "utf8")),
        amount: orNumericCriteria(Joi.number().integer().min(0)),
        fee: orNumericCriteria(Joi.number().integer().min(0)),
        asset: orContainsCriteria(Joi.object()),
    };

    return {
        pagination,
        blockId,
        address,
        delegateIdentifier,
        username,
        integerBetween,
        percentage,
        numberFixedOrBetween,
        walletId,
        orderBy,
        equalCriteria,
        numericCriteria,
        likeCriteria,
        containsCriteria,
        orCriteria,
        orEqualCriteria,
        orNumericCriteria,
        orLikeCriteria,
        orContainsCriteria,
        blockCriteriaSchemas,
        transactionCriteriaSchemas,
    };
};
