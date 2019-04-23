import "../../../../../packages/core-jest-matchers/src/transactions/types/second-signature";

import { Enums } from "@arkecosystem/crypto";
const { TransactionTypes } = Enums;

describe(".toBeSecondSignatureType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.SecondSignature,
        }).toBeSecondSignatureType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeSecondSignatureType).toThrowError(
            "Expected value to be a valid SecondSignature transaction.",
        );
    });
});
