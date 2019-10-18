import "jest-extended";

import { calculateTransactionExpiration } from "@packages/core-kernel/src/utils/expiration-calculator";

describe("Calculate Transaction Expiration", () => {
    it("should use the transaction expiration if the transaction version is 2", () => {
        expect(
            // @ts-ignore
            calculateTransactionExpiration({
                version: 2,
                expiration: 100,
            }),
        ).toBe(100);
    });

    it("should return undefined if the transaction version is 2 and no expiration is set", () => {
        expect(
            // @ts-ignore
            calculateTransactionExpiration({
                version: 2,
            }),
        ).toBeUndefined();
    });

    it("should calculate the expiration if the transaction version is 1", () => {
        expect(
            calculateTransactionExpiration(
                // @ts-ignore
                {
                    timestamp: 1000,
                },
                {
                    blockTime: 8,
                    currentHeight: 100,
                    now: 2000,
                    maxTransactionAge: 500,
                },
            ),
        ).toBe(475);
    });
});
