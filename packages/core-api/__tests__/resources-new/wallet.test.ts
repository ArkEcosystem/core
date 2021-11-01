import { Utils } from "@arkecosystem/crypto";

import { walletCriteriaSchemaObject } from "../../../../packages/core-api/src/resources-new/wallet";

describe("walletCriteriaSchemaObject.address", () => {
    it("should allow correct address", () => {
        const result = walletCriteriaSchemaObject.address.validate("AXzxJ8Ts3dQ2bvBR1tPE7GUee9iSEJb8HX");
        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid address", () => {
        const result = walletCriteriaSchemaObject.address.validate("bad address");
        expect(result.error).toBeTruthy();
    });

    it("should allow like expression", () => {
        const result = walletCriteriaSchemaObject.address.validate("AX%");
        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid like expression", () => {
        const result = walletCriteriaSchemaObject.address.validate("$@!%");
        expect(result.error).toBeTruthy();
    });
});

describe("walletCriteriaSchemaObject.publicKey", () => {
    it("should allow correct public key", () => {
        const result = walletCriteriaSchemaObject.publicKey.validate(
            "03da05c1c1d4f9c6bda13695b2f29fbc65d9589edc070fc61fe97974be3e59c14e",
        );
        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid public key", () => {
        const result = walletCriteriaSchemaObject.publicKey.validate("bad public key");
        expect(result.error).toBeTruthy();
    });

    it("should allow like expression", () => {
        const result = walletCriteriaSchemaObject.publicKey.validate("03%");
        expect(result.error).toBe(undefined);
    });

    it("should not allow invalid like expression", () => {
        const result = walletCriteriaSchemaObject.publicKey.validate("$@!%");
        expect(result.error).toBeTruthy();
    });
});

describe("walletCriteriaSchemaObject.balance", () => {
    it("should allow numeric string value", () => {
        const result = walletCriteriaSchemaObject.balance.validate("123456");
        expect(result.error).toBe(undefined);
    });

    it("should allow explicitly positive string value", () => {
        const result = walletCriteriaSchemaObject.balance.validate("+123456");
        expect(result.error).toBe(undefined);
    });

    it("should allow negative numeric string value", () => {
        const result = walletCriteriaSchemaObject.balance.validate("-123456");
        expect(result.error).toBe(undefined);
    });

    it("should not allow non-numeric string value", () => {
        const result = walletCriteriaSchemaObject.balance.validate("bad balance");
        expect(result.error).toBeTruthy();
    });

    it("should convert value to Utils.BigNumber", () => {
        const result = walletCriteriaSchemaObject.balance.validate("123456");
        expect(result.value).toBeInstanceOf(Utils.BigNumber);
    });

    it("should allow from and to boundaries", () => {
        const result = walletCriteriaSchemaObject.balance.validate({ from: "123456", to: "123456" });
        expect(result.error).toBe(undefined);
    });
});

describe("walletCriteriaSchemaObject.nonce", () => {
    it("should allow numeric string value", () => {
        const result = walletCriteriaSchemaObject.nonce.validate("123456");
        expect(result.error).toBe(undefined);
    });

    it("should allow zero value", () => {
        const result = walletCriteriaSchemaObject.nonce.validate("0");
        expect(result.error).toBe(undefined);
    });

    it("should allow explicitly positive string value", () => {
        const result = walletCriteriaSchemaObject.nonce.validate("+123456");
        expect(result.error).toBe(undefined);
    });

    it("should not allow negative numeric string value", () => {
        const result = walletCriteriaSchemaObject.nonce.validate("-123456");
        expect(result.error).toBeTruthy();
    });

    it("should not allow non-numeric string value", () => {
        const result = walletCriteriaSchemaObject.nonce.validate("bad nonce");
        expect(result.error).toBeTruthy();
    });

    it("should convert value to Utils.BigNumber", () => {
        const result = walletCriteriaSchemaObject.nonce.validate("123456");
        expect(result.value).toBeInstanceOf(Utils.BigNumber);
    });

    it("should allow from and to boundaries", () => {
        const result = walletCriteriaSchemaObject.nonce.validate({ from: "123456", to: "123456" });
        expect(result.error).toBe(undefined);
    });
});
