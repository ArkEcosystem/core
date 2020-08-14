import { Utils } from "@arkecosystem/crypto";

import { walletCriteriaQuerySchema } from "../../../../packages/core-api/src/resources-new/wallet";

describe("walletCriteriaQuerySchema.address", () => {
    it("should allow correct address", () => {
        const result = walletCriteriaQuerySchema.validate({
            address: "AXzxJ8Ts3dQ2bvBR1tPE7GUee9iSEJb8HX",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow incorrect address", () => {
        const result = walletCriteriaQuerySchema.validate({
            address: "bad address",
        });

        expect(result.error).toBeTruthy();
    });

    it("should allow like expression", () => {
        const result = walletCriteriaQuerySchema.validate({
            address: "AX%",
        });

        expect(result.error).toBe(undefined);
    });
});

describe("walletQueryCriteriaSchema.publicKey", () => {
    it("should allow correct public key", () => {
        const result = walletCriteriaQuerySchema.validate({
            publicKey: "03da05c1c1d4f9c6bda13695b2f29fbc65d9589edc070fc61fe97974be3e59c14e",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow incorrect public key", () => {
        const result = walletCriteriaQuerySchema.validate({
            publicKey: "bad public key",
        });

        expect(result.error).toBeTruthy();
    });

    it("should allow like expression", () => {
        const result = walletCriteriaQuerySchema.validate({
            publicKey: "03%",
        });

        expect(result.error).toBe(undefined);
    });
});

describe("walletQueryCriteriaSchema.balance", () => {
    it("should allow numeric string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            balance: "123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow explicitly positive string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            balance: "+123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow negative numeric string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            balance: "-123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow non-numeric string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            balance: "bad balance",
        });

        expect(result.error).toBeTruthy();
    });

    it("should convert value to Utils.BigNumber", () => {
        const result = walletCriteriaQuerySchema.validate({
            balance: "123456",
        });

        expect(result.value.balance).toBeInstanceOf(Utils.BigNumber);
    });

    it("should allow from and to boundaries", () => {
        const result = walletCriteriaQuerySchema.validate({
            "balance.from": "123456",
            "balance.to": "123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow simultaneous from or to boundaries and exact value", () => {
        const result = walletCriteriaQuerySchema.validate({
            balance: "123456",
            "balance.from": "123456",
            "balance.to": "123456",
        });

        expect(result.error).toBeTruthy();
    });
});

describe("walletQueryCriteriaSchema.nonce", () => {
    it("should allow numeric string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow zero value", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "0",
        });

        expect(result.error).toBe(undefined);
    });

    it("should allow explicitly positive string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "+123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow negative numeric string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "-123456",
        });

        expect(result.error).toBeTruthy();
    });

    it("should not allow non-numeric string value", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "bad nonce",
        });

        expect(result.error).toBeTruthy();
    });

    it("should convert value to Utils.BigNumber", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "123456",
        });

        expect(result.value.nonce).toBeInstanceOf(Utils.BigNumber);
    });

    it("should allow from and to boundaries", () => {
        const result = walletCriteriaQuerySchema.validate({
            "nonce.from": "123456",
            "nonce.to": "123456",
        });

        expect(result.error).toBe(undefined);
    });

    it("should not allow simultaneous from or to boundaries and exact value", () => {
        const result = walletCriteriaQuerySchema.validate({
            nonce: "123456",
            "nonce.from": "123456",
            "nonce.to": "123456",
        });

        expect(result.error).toBeTruthy();
    });
});

describe("walletQueryCriteriaSchema.attributes", () => {
    it("should allow any key starting with attributes.", () => {
        const result = walletCriteriaQuerySchema.validate({
            "attributes.vote": "no checks over public key format",
            "attributes.delegate.voteBalance": "no checks here either",
        });

        expect(result.error).toBe(undefined);
    });
});

describe("walletQueryCriteriaSchema", () => {
    it("should not allow unknown keys", () => {
        const result = walletCriteriaQuerySchema.validate({
            some: "value",
        });

        expect(result.error).toBeTruthy();
    });
});
