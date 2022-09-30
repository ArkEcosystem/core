import "jest-extended";

import { Interfaces } from "@arkecosystem/crypto";

import { MempoolIndex } from "../../../packages/core-transaction-pool/src/mempool-index";

describe("MempoolIndex", () => {
    let index: MempoolIndex;
    let transaction: Interfaces.ITransaction;

    beforeEach(() => {
        index = new MempoolIndex();
        transaction = {} as Interfaces.ITransaction;
    });

    it("should set key", () => {
        const key = "key";

        expect(index.has(key)).toBeFalse();

        index.set(key, transaction);

        expect(index.has(key)).toBeTrue();
    });

    it("should get key", () => {
        const key = "key";

        index.set(key, transaction);

        expect(index.get(key)).toEqual(transaction);

        index.forget(key);

        expect(() => {
            index.get(key);
        }).toThrow();
    });

    it("should forget key", () => {
        const key = "key";

        index.set(key, transaction);

        expect(index.has(key)).toBeTrue();

        index.forget(key);

        expect(index.has(key)).toBeFalse();
    });

    it("should clear all keys", () => {
        const key = "key";

        index.set(key, transaction);

        expect(index.has(key)).toBeTrue();

        index.clear();

        expect(index.has(key)).toBeFalse();
    });
});
