import "jest-extended";

import { TransferHandler } from "../../../../../packages/crypto/src/handlers/transactions/transfer";
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
        it("should be true", () => {
            expect(handler.canApply(wallet, transaction, [])).toBeTrue();
        });

        it("should be false", () => {
            transaction.senderPublicKey = "a".repeat(66);

            expect(handler.canApply(wallet, transaction, [])).toBeFalse();
        });
    });
});
