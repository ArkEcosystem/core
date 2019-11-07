import { app } from "@arkecosystem/core-container";
import { calculateLockExpirationStatus } from "../../../packages/core-utils/src/lock-expiration-calculator";

// @ts-ignore
app.resolvePlugin = jest.fn(plugin => {
    if (plugin === "state") {
        return {
            getStore: () => ({
                getLastBlock: () => {
                    return {
                        data: {
                            height: 10000,
                            timestamp: 10000,
                        },
                    };
                },
            }),
        };
    }

    return {};
});

describe("Lock expiration calculator", () => {
    describe("calculateLockExpirationStatus", () => {
        it("should calculate correctly based on height", () => {
            const expired = { type: 1, value: 9999 };
            expect(calculateLockExpirationStatus(expired)).toBeTrue();

            const notExpired = { type: 1, value: 10001 };
            expect(calculateLockExpirationStatus(notExpired)).toBeFalse();
        });

        it("should calculate correctly based on timestamp", () => {
            const expired = { type: 2, value: 9999 };
            expect(calculateLockExpirationStatus(expired)).toBeTrue();

            const notExpired = { type: 2, value: 10001 };
            expect(calculateLockExpirationStatus(notExpired)).toBeFalse();
        });
    });
});
