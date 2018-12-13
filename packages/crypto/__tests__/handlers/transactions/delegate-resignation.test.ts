import "jest-extended";

import { DelegateResignationHandler } from "../../../src/handlers/transactions/delegate-resignation";
import { transaction as originalTransaction } from "./__fixtures__/transaction";
import { wallet as originalWallet } from "./__fixtures__/wallet";

const handler = new DelegateResignationHandler();

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
});
