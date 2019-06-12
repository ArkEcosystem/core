import "../../../../../packages/core-jest-matchers/src/transactions/types/multi-signature";

import { Enums } from "@arkecosystem/crypto";
const { TransactionTypes } = Enums;

describe(".toBeMultiSignatureType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.MultiSignature,
        }).toBeMultiSignatureType();
    });

    test("fails when given an invalid transaction", () => {
        expect(expect({ type: "invalid" }).toBeMultiSignatureType).toThrowError(
            "Expected value to be a valid MultiSignature transaction.",
        );
    });
});
