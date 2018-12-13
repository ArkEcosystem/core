import "jest-extended";

import { TimelockTransferHandler } from "../../../src/handlers/transactions/timelock-transfer";
import { transaction as originalTransaction } from "./__fixtures__/transaction";
import { wallet as originalWallet } from "./__fixtures__/wallet";

const handler = new TimelockTransferHandler();

let wallet;
let transaction;

beforeEach(() => {
    wallet = originalWallet;
    transaction = originalTransaction;
});

describe("TimelockTransferHandler", () => {
    it("should be instantiated", () => {
        expect(handler.constructor.name).toBe("TimelockTransferHandler");
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
