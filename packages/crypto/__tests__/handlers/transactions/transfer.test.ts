import "jest-extended";

import { TransferHandler } from "../../../src/handlers/transactions/transfer";
import { transaction as originalTransaction } from "./__fixtures__/transaction";
import { wallet as originalWallet } from "./__fixtures__/wallet";

const handler = new TransferHandler();

let wallet;
let transaction;

beforeEach(() => {
    wallet = originalWallet;
    transaction = originalTransaction;
});

describe("TransferHandler", () => {
    it("should be instantiated", () => {
        expect(handler.constructor.name).toBe("TransferHandler");
    });

    describe("canApply", () => {
        it("should be a function", () => {
            expect(handler.canApply).toBeFunction();
        });

        it("should be true", () => {
            expect(handler.canApply(wallet, transaction, [])).toBeTrue();
        });

        it("should be false", () => {
            transaction.senderPublicKey = "a".repeat(66);

            expect(handler.canApply(wallet, transaction, [])).toBeFalse();
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
