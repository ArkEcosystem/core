import { CryptoSuite } from "@packages/core-crypto";
import { FindOperator } from "typeorm";

import { transformBigInt, transformVendorField } from "../../../../packages/core-database/src/utils/transform";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

describe("transformBigInt.from", () => {
    it("should transform string value to BigNumber", () => {
        const original = "5";
        const transformed = transformBigInt.from(original);
        expect(transformed).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("5"));
    });

    it("should not transform undefined value", () => {
        const original = undefined;
        const transformed = transformBigInt.from(original);
        expect(transformed).toBeUndefined();
    });
});

describe("transformBigInt.to", () => {
    it("should transform BigNumber value to string", () => {
        const original = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("5");
        const transformed = transformBigInt.to(original as any);
        expect(transformed).toEqual("5");
    });

    it("should return FindOperator.value", () => {
        const original = new FindOperator("equal", crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("5"));
        const transformed = transformBigInt.to(original);
        expect(transformed).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("5"));
    });
});

describe("transformVendorField.from", () => {
    it("should transform string value to BigNumber", () => {
        const original = Buffer.from("hello world", "utf-8");
        const transformed = transformVendorField.from(original);
        expect(transformed).toEqual("hello world");
    });

    it("should not transform undefined value", () => {
        const original = undefined;
        const transformed = transformVendorField.from(original);
        expect(transformed).toBeUndefined();
    });
});

describe("transformVendorField.to", () => {
    it("should transform BigNumber value to string", () => {
        const original = "hello world";
        const transformed = transformVendorField.to(original);
        expect(transformed).toEqual(Buffer.from("hello world", "utf-8"));
    });

    it("should return FindOperator.value", () => {
        const original = new FindOperator("equal", "hello world");
        const transformed = transformVendorField.to(original);
        expect(transformed).toEqual(Buffer.from("hello world", "utf-8"));
    });
});
