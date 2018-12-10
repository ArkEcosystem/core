import "jest-extended";
import { client as ark } from "../../../src/client";
import { TRANSACTION_TYPES } from "../../../src/constants";
import { feeManager } from "../../../src/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder;

beforeEach(() => {
    builder = ark.getBuilder().delegateResignation();

    // @ts-ignore
    global.builder = builder;
});

describe("Delegate Resignation Transaction", () => {
    transactionBuilder();

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TRANSACTION_TYPES.DELEGATE_RESIGNATION);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION));
    });
});
