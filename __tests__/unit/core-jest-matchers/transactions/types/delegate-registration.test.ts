import "../../../../../packages/core-jest-matchers/src/transactions/types/delegate-registration";

import { Enums } from "@arkecosystem/crypto";
const { TransactionTypes } = Enums;

describe(".toBeDelegateRegistrationType", () => {
    test("passes when given a delegate transaction", () => {
        expect({
            type: TransactionTypes.DelegateRegistration,
        }).toBeDelegateRegistrationType();
    });

    test("fails when given a non-delegate transaction", () => {
        expect(expect({ type: "invalid" }).toBeDelegateRegistrationType).toThrowError(
            "Expected value to be a valid DELEGATE transaction.",
        );
    });
});
