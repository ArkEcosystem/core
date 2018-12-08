import "jest-extended";
import ark from "../../../src/client";
import { TRANSACTION_TYPES } from "../../../src/constants";
import feeManager from "../../../src/managers/fee";
import transactionBuilderTests from "./__shared__/transaction";

let builder;

beforeEach(() => {
  builder = ark.getBuilder().delegateResignation();

  // @ts-ignore
  global.builder = builder;
});

describe("Delegate Resignation Transaction", () => {
  transactionBuilderTests();

  it("should have its specific properties", () => {
    expect(builder).toHaveProperty(
      "data.type",
      TRANSACTION_TYPES.DELEGATE_RESIGNATION
    );
    expect(builder).toHaveProperty(
      "data.fee",
      feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)
    );
  });
});
