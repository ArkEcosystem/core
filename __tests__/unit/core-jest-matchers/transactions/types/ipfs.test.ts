import "../../../../../packages/core-jest-matchers/src/transactions/types/ipfs";

import { Enums } from "@arkecosystem/crypto";
const { TransactionType } = Enums;

describe(".toBeIpfsType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TransactionType.Ipfs }).toBeIpfsType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeIpfsType).toThrowError("Expected value to be a valid IPFS transaction.");
    });
});
