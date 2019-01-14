import "jest-extended";
import { DelegateResignationBuilder } from "../../../src/builder/transactions/delegate-resignation";
import { client as ark } from "../../../src/client";
import { TransactionTypes } from "../../../src/constants";
import { feeManager } from "../../../src/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder : DelegateResignationBuilder;

beforeEach(() => {
    builder = ark.getBuilder().delegateResignation();
});

describe("Delegate Resignation Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.DelegateResignation);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.DelegateResignation));
    });
});
