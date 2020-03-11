import "jest-extended";

import { Enums, Interfaces } from "@arkecosystem/crypto";
import {
    calculateLockExpirationStatus,
    calculateTransactionExpiration,
} from "@packages/core-kernel/src/utils/expiration-calculator";

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

describe("Calculate Lock Expiration Status", () => {
    it("should return false when expiration value is higher than block timestamp", () => {
        const lastBlock = { data: { timestamp: 1000 } } as Interfaces.IBlock;
        const expiration = {
            type: Enums.HtlcLockExpirationType.EpochTimestamp,
            value: 1001,
        } as Interfaces.IHtlcExpiration;

        const expired = calculateLockExpirationStatus(lastBlock, expiration);

        expect(expired).toBeFalse();
    });

    it("should return true when expiration value isn't higher than block timestamp", () => {
        const lastBlock = { data: { timestamp: 1000 } } as Interfaces.IBlock;
        const expiration = {
            type: Enums.HtlcLockExpirationType.EpochTimestamp,
            value: 1000,
        } as Interfaces.IHtlcExpiration;

        const expired = calculateLockExpirationStatus(lastBlock, expiration);

        expect(expired).toBeTrue();
    });

    it("should return false when expiration value is higher than block height", () => {
        const lastBlock = { data: { height: 1000 } } as Interfaces.IBlock;
        const expiration = {
            type: Enums.HtlcLockExpirationType.BlockHeight,
            value: 1001,
        } as Interfaces.IHtlcExpiration;

        const expired = calculateLockExpirationStatus(lastBlock, expiration);

        expect(expired).toBeFalse();
    });

    it("should return true when expiration value isn't higher than block height", () => {
        const lastBlock = { data: { height: 1000 } } as Interfaces.IBlock;
        const expiration = {
            type: Enums.HtlcLockExpirationType.BlockHeight,
            value: 1000,
        } as Interfaces.IHtlcExpiration;

        const expired = calculateLockExpirationStatus(lastBlock, expiration);

        expect(expired).toBeTrue();
    });
});
