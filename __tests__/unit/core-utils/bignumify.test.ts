import { Utils } from "@arkecosystem/crypto";
import "jest-extended";
import { bignumify } from "../../../packages/core-utils/src/bignumify";

describe("Bignumify", () => {
    it("should create a bignumber instance", () => {
        expect(bignumify(1)).toBeInstanceOf(Utils.Bignum);
    });

    it("should create a fixed number", () => {
        expect(bignumify(3.14).toFixed()).toBe("3.14");
    });

    it("should create a number", () => {
        expect(bignumify(3.14).toNumber()).toBe(3.14);
    });

    it("should create a string", () => {
        expect(bignumify(3.14).toString()).toBe("3.14");
    });
});
