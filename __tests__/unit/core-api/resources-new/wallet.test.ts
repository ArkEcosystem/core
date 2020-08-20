import { Utils } from "@arkecosystem/crypto";

import { walletCriteriaSchema } from "../../../../packages/core-api/src/resources-new/wallet";

describe("walletCriteriaSchema.address", () => {
    it("should allow correct address", () => {
        const result = walletCriteriaSchema.validate({
            address: "AXzxJ8Ts3dQ2bvBR1tPE7GUee9iSEJb8HX",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid address", () => {
        const result = walletCriteriaSchema.validate({
            address: "bad address",
        });

        expect(result.error).toBeTruthy();
    });

    it("should allow like expression", () => {
        const result = walletCriteriaSchema.validate({
            address: "AX%",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid like expression", () => {
        const result = walletCriteriaSchema.validate({
            address: "$@!%",
        });

        expect(result.error).toBeTruthy();
    });
});

describe("walletQueryCriteriaSchema.publicKey", () => {
    it("should allow correct public key", () => {
        const result = walletCriteriaSchema.validate({
            publicKey: "03da05c1c1d4f9c6bda13695b2f29fbc65d9589edc070fc61fe97974be3e59c14e",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid public key", () => {
        const result = walletCriteriaSchema.validate({
            publicKey: "bad public key",
        });

        expect(result.error).toBeTruthy();
    });

    it("should allow like expression", () => {
        const result = walletCriteriaSchema.validate({
            publicKey: "03%",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid like expression", () => {
        const result = walletCriteriaSchema.validate({
            publicKey: "$@!%",
        });

        expect(result.error).toBeTruthy();
    });
});

describe("walletQueryCriteriaSchema.balance", () => {
    it("should allow numeric string value", () => {
        const result = walletCriteriaSchema.validate({
            balance: "123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow explicitly positive string value", () => {
        const result = walletCriteriaSchema.validate({
            balance: "+123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow negative numeric string value", () => {
        const result = walletCriteriaSchema.validate({
            balance: "-123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow non-numeric string value", () => {
        const result = walletCriteriaSchema.validate({
            balance: "bad balance",
        });

        expect(result.error).toBeTruthy();
    });

    it("should convert value to Utils.BigNumber", () => {
        const result = walletCriteriaSchema.validate({
            balance: "123456",
        });

        expect(result.value.balance[0]).toBeInstanceOf(Utils.BigNumber);
    });

    it("should allow from and to boundaries", () => {
        const result = walletCriteriaSchema.validate({
            balance: {
                from: "123456",
                to: "123456",
            },
        });

        expect(result.error).toBe(undefined);
    });
});

describe("walletQueryCriteriaSchema.nonce", () => {
    it("should allow numeric string value", () => {
        const result = walletCriteriaSchema.validate({
            nonce: "123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow zero value", () => {
        const result = walletCriteriaSchema.validate({
            nonce: "0",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow explicitly positive string value", () => {
        const result = walletCriteriaSchema.validate({
            nonce: "+123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow negative numeric string value", () => {
        const result = walletCriteriaSchema.validate({
            nonce: "-123456",
        });

        expect(result.error).toBeTruthy();
    });

    it("should not allow non-numeric string value", () => {
        const result = walletCriteriaSchema.validate({
            nonce: "bad nonce",
        });

        expect(result.error).toBeTruthy();
    });

    it("should convert value to Utils.BigNumber", () => {
        const result = walletCriteriaSchema.validate({
            nonce: "123456",
        });

        expect(result.value.nonce[0]).toBeInstanceOf(Utils.BigNumber);
    });

    it("should allow from and to boundaries", () => {
        const result = walletCriteriaSchema.validate({
            nonce: {
                from: "123456",
                to: "123456",
            },
        });

        expect(result.error).toBe(undefined);
    });
});

describe("walletQueryCriteriaSchema", () => {
    it("should not allow unknown keys", () => {
        const result = walletCriteriaSchema.validate({
            some: "value",
        });

        expect(result.error).toBeTruthy();
    });
});
