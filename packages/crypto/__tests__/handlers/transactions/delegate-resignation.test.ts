import "jest-extended";
import handler from "../../../src/handlers/transactions/delegate-resignation";
import originalWallet from "./__fixtures__/wallet";
import originalTransaction from "./__fixtures__/transaction";

let wallet;
let transaction;

beforeEach(() => {
  wallet = originalWallet;
  transaction = originalTransaction;
});

describe("DelegateResignationHandler", () => {
  it("should be instantiated", () => {
    expect(handler.constructor.name).toBe("DelegateResignationHandler");
  });

  describe("canApply", () => {
    it("should be a function", () => {
      expect(handler.canApply).toBeFunction();
    });

    it("should be truth", () => {
      wallet.username = "dummy";

      expect(handler.canApply(wallet, transaction, [])).toBeTrue();
    });

    it("should be false if wallet has no registered username", () => {
      wallet.username = null;
      const errors = [];

      expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
      expect(errors).toContain("Wallet has not registered a username");
    });
  });

  describe("apply", () => {
    it("should be a function", () => {
      expect(handler.apply).toBeFunction();
    });
  });

  describe("revert", () => {
    it("should be a function", () => {
      expect(handler.revert).toBeFunction();
    });
  });
});
