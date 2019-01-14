import "jest-extended";
import { DelegateResignationBuilder } from "../../../dist/builder";
import { client as ark } from "../../../dist/client";
import { TransactionTypes } from "../../../dist/constants";
import { feeManager } from "../../../dist/managers/fee";
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
