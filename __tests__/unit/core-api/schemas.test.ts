import { bigNumber, nonNegativeBigNumber, positiveBigNumber } from "@arkecosystem/core-api/src/schemas";
import { Utils } from "@arkecosystem/core-kernel";

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
