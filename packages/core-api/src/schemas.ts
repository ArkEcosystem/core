import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import Joi from "joi";

const isSchema = (value: Joi.Schema | SchemaObject): value is Joi.Schema => {
    return Joi.isSchema(value);
};

// BigNumber

export const bigNumber = Joi.custom((value: unknown) => {
    return Utils.BigNumber.make(value as any);
});

export const nonNegativeBigNumber = bigNumber.custom((value: Utils.BigNumber, helpers) => {
    return value.isGreaterThanEqual(0) ? value : helpers.error("any.invalid");
});

export const positiveBigNumber = bigNumber.custom((value: Utils.BigNumber, helpers) => {
    return value.isGreaterThanEqual(1) ? value : helpers.error("any.invalid");
});

// Criteria

export type SchemaObject = {
    [x: string]: Joi.Schema | SchemaObject;
};

export const createCriteriaSchema = (schemaObject: SchemaObject): Joi.ObjectSchema => {
    const schema = {};

    for (const [key, value] of Object.entries(schemaObject)) {
        schema[key] = Joi.array()
            .single()
            .items(isSchema(value) ? value : createCriteriaSchema(value));
    }

    return Joi.object(schema);
};

export const createRangeCriteriaSchema = (item: Joi.Schema): Joi.Schema => {
    return Joi.alternatives(item, Joi.object({ from: item, to: item }).or("from", "to"));
};

// Sorting

export const createSortingSchema = (schemaObject: SchemaObject, wildcardPaths: string[] = []): Joi.ObjectSchema => {
    const getObjectPaths = (object: SchemaObject): string[] => {
        return Object.entries(object)
            .map(([key, value]) => {
                return isSchema(value) ? key : getObjectPaths(value).map((p) => `${key}.${p}`);
            })
            .flat();
    };

    const exactPaths = getObjectPaths(schemaObject);

    return Joi.object({
        orderBy: Joi.custom((value, helpers) => {
            if (value === "") {
                return [];
            }

            const sorting: Contracts.Search.Sorting = [];

            for (const item of value.split(",")) {
                const pair = item.split(":");
                const property = String(pair[0]);
                const direction = pair.length === 1 ? "asc" : pair[1];

                if (!exactPaths.includes(property) && !wildcardPaths.find((wp) => property.startsWith(`${wp}.`))) {
                    return helpers.message({
                        custom: `Unknown orderBy property '${property}'`,
                    });
                }

                if (direction !== "asc" && direction !== "desc") {
                    return helpers.message({
                        custom: `Unexpected orderBy direction '${direction}' for property '${property}'`,
                    });
                }

                sorting.push({ property, direction: direction as "asc" | "desc" });
            }

            return sorting;
        }).default([]),
    });
};

// Pagination

export const pagination = Joi.object({
    page: Joi.number().integer().positive().default(1),
    offset: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1).default(100).max(Joi.ref("$configuration.plugins.pagination.limit")),
}); // .without("offset", "page"); // conflict with pagination plugin

// Old

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

export const orderBy = Joi.alternatives().try(
    Joi.string().regex(/^[a-z._]{1,40}:(asc|desc)$/i),
    Joi.array().items(Joi.string().regex(/^[a-z._]{1,40}:(asc|desc)$/i)),
);

export const blocksOrderBy = orderBy.default("height:desc");
export const transactionsOrderBy = orderBy.default(["timestamp:desc", "sequence:desc"]);

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
