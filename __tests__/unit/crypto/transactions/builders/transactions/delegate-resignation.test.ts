import "jest-extended";
import { client } from "../../../../../../packages/crypto/src/client";
import { TransactionTypes } from "../../../../../../packages/crypto/src/enums";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { DelegateResignationBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/delegate-resignation";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: DelegateResignationBuilder;

beforeEach(() => {
    builder = client.getBuilder().delegateResignation();
});

describe("Delegate Resignation Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.DelegateResignation);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.DelegateResignation));
    });
});
