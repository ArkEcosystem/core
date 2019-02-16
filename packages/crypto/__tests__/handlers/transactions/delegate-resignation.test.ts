import "jest-extended";

import { DelegateResignationHandler } from "../../../src/handlers/transactions/delegate-resignation";
import { Bignum } from "../../../src/utils";
import { transaction as originalTransaction } from "./__fixtures__/transaction";
import { wallet as originalWallet } from "./__fixtures__/wallet";

const handler = new DelegateResignationHandler();

let wallet;
let transaction;
let errors;

beforeEach(() => {
    wallet = originalWallet;
    transaction = originalTransaction;

    errors = [];
});

describe("DelegateResignationHandler", () => {
    describe("canApply", () => {
        it("should be truth", () => {
            wallet.username = "dummy";

            expect(handler.canApply(wallet, transaction, [])).toBeTrue();
        });

        it("should be false if wallet has no registered username", () => {
            wallet.username = null;

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Wallet has not registered a username");
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Bignum.ZERO;

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Insufficient balance in the wallet");
        });
    });
});
