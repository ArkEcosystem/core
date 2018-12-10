import "../../../../src/matchers/transactions/types/ipfs";

import { constants } from "@arkecosystem/crypto";
const { TRANSACTION_TYPES } = constants;

describe(".toBeIpfsType", () => {
    test("passes when given a valid transaction", () => {
        expect({ type: TRANSACTION_TYPES.IPFS }).toBeIpfsType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeIpfsType();
    });
});
