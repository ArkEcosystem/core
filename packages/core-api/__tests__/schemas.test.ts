import {
    bigNumber,
    createRangeCriteriaSchema,
    createSortingSchema,
    nonNegativeBigNumber,
    positiveBigNumber,
} from "@arkecosystem/core-api/src/schemas";
import { Utils } from "@arkecosystem/core-kernel";
import Joi from "joi";

describe("bigNumber", () => {
    it("should convert string to Utils.BigNumber", () => {
        const result = bigNumber.validate("12345");

        expect(result.value).toBeInstanceOf(Utils.BigNumber);
    });
});

describe("nonNegativeBigNumber", () => {
    it("should convert string to Utils.BigNumber", () => {
        const result = nonNegativeBigNumber.validate("12345");

        expect(result.value).toBeInstanceOf(Utils.BigNumber);
        expect(result.value.toFixed()).toEqual("12345");
    });

    it("should allow zero value", () => {
        const result = nonNegativeBigNumber.validate("0");

        expect(result.value).toBeInstanceOf(Utils.BigNumber);
        expect(result.value.toFixed()).toEqual("0");
    });

    it("should not allow negative value", () => {
        const result = nonNegativeBigNumber.validate("-12345");

        expect(result.error).toBeTruthy();
    });
});

describe("positiveBigNumber", () => {
    it("should convert string to Utils.BigNumber", () => {
        const result = positiveBigNumber.validate("12345");

        expect(result.value).toBeInstanceOf(Utils.BigNumber);
        expect(result.value.toFixed()).toEqual("12345");
    });

    it("should not allow zero value", () => {
        const result = positiveBigNumber.validate("0");

        expect(result.error).toBeTruthy();
    });

    it("should not allow negative value", () => {
        const result = positiveBigNumber.validate("-12345");

        expect(result.error).toBeTruthy();
    });
});

describe("createRangeCriteriaSchema", () => {
    it("should be valid", () => {
        const schema = createRangeCriteriaSchema(Joi.number().integer().min(1));

        const result = schema.validate({ from: 1, to: 2 });

        expect(result).toEqual({
            value: {
                from: 1,
                to: 2,
            },
        });
    });

    it("should be invalid if from doesn't satisfy condition", () => {
        const schema = createRangeCriteriaSchema(Joi.number().integer().min(1));

        const result = schema.validate({ from: 0, to: 2 });

        expect(result.error!.message).toEqual('"from" must be greater than or equal to 1');
    });

    it("should be invalid if to doesn't satisfy condition", () => {
        const schema = createRangeCriteriaSchema(Joi.number().integer().min(1));

        const result = schema.validate({ from: 1, to: 0 });

        expect(result.error!.message).toEqual('"to" must be greater than or equal to 1');
    });
});

describe("createSortingSchema", () => {
    const testCriteriaSchemaObject = {
        username: Joi.string().max(256),
    };

    it("should use asc direction if direction is not present", () => {
        const sortingSchema = createSortingSchema(testCriteriaSchemaObject);

        const result = sortingSchema.validate({ orderBy: "username" });

        expect(result).toEqual({
            value: {
                orderBy: [
                    {
                        property: "username",
                        direction: "asc",
                    },
                ],
            },
        });
    });

    it("should use given direction", () => {
        const sortingSchema = createSortingSchema(testCriteriaSchemaObject);

        const result = sortingSchema.validate({ orderBy: "username:desc" });

        expect(result).toEqual({
            value: {
                orderBy: [
                    {
                        property: "username",
                        direction: "desc",
                    },
                ],
            },
        });
    });

    it("should return empty order if orderBy is empty string", () => {
        const sortingSchema = createSortingSchema(testCriteriaSchemaObject);

        const result = sortingSchema.validate({ orderBy: "" });

        expect(result).toEqual({
            value: {
                orderBy: [],
            },
        });
    });

    it("should contain error if direction is unknown", () => {
        const sortingSchema = createSortingSchema(testCriteriaSchemaObject);

        const result = sortingSchema.validate({ orderBy: "username:invalid" });

        expect(result.error!.message).toEqual("Unexpected orderBy direction 'invalid' for property 'username'");
    });

    it("should contain error if property is unknown", () => {
        const sortingSchema = createSortingSchema(testCriteriaSchemaObject);

        const result = sortingSchema.validate({ orderBy: "invalid:asc" });

        expect(result.error!.message).toEqual("Unknown orderBy property 'invalid'");
    });

    it("should return orderBy if property is defined in wildcardPaths", () => {
        const sortingSchema = createSortingSchema(testCriteriaSchemaObject, ["invalid"]);

        const result = sortingSchema.validate({ orderBy: "invalid.username:asc" });

        expect(result).toEqual({
            value: {
                orderBy: [
                    {
                        property: "invalid.username",
                        direction: "asc",
                    },
                ],
            },
        });
    });
});
