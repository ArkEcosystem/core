import "../../../src/transactions/types/second-signature";

import { constants } from "@arkecosystem/crypto";
const { TransactionTypes } = constants;

describe(".toBeSecondSignatureType", () => {
    test("passes when given a valid transaction", () => {
        expect({
            type: TransactionTypes.SecondSignature,
        }).toBeSecondSignatureType();
    });

    test("fails when given an invalid transaction", () => {
        expect({ type: "invalid" }).not.toBeSecondSignatureType();
    });
});
