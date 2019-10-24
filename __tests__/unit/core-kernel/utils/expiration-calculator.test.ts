import "jest-extended";

import { calculateTransactionExpiration } from "@packages/core-kernel/src/utils/expiration-calculator";

const context = {
    blockTime: 8,
    currentHeight: 100,
    now: 2000,
    maxTransactionAge: 500,
};

describe("Calculate Transaction Expiration", () => {
    it("should use the transaction expiration if the transaction version is 2", () => {
        expect(
            calculateTransactionExpiration(
                // @ts-ignore
                {
                    version: 2,
                    expiration: 100,
                },
                context,
            ),
        ).toBe(100);
    });

    it("should return undefined if the transaction version is 2 and no expiration is set", () => {
        expect(
            calculateTransactionExpiration(
                // @ts-ignore
                {
                    version: 2,
                },
                context,
            ),
        ).toBeUndefined();
    });

    it("should calculate the expiration if the transaction version is 1", () => {
        expect(
            calculateTransactionExpiration(
                // @ts-ignore
                {
                    timestamp: 1000,
                },
                context,
            ),
        ).toBe(475);
    });
});
