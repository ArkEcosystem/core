import "jest-extended";

import { SecondSignatureHandler } from "../../../src/handlers/transactions/second-signature";
import { Bignum } from "../../../src/utils";

const handler = new SecondSignatureHandler();

let wallet;
let transaction;
let errors;

beforeEach(() => {
    wallet = {
        address: "DSD9Wi2rfqzDb3REUB5MELQGrsUAjY67gj",
        balance: new Bignum("6453530000000"),
        publicKey: "03cba4fd60f856ad034ee0a9146432757ae35956b640c26fb6674061924b05a5c9",
    };

    transaction = {
        version: 1,
        network: 30,
        type: 1,
        timestamp: 53995738,
        senderPublicKey: "03cba4fd60f856ad034ee0a9146432757ae35956b640c26fb6674061924b05a5c9",
        fee: new Bignum(500000000),
        asset: {
            signature: {
                publicKey: "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8",
            },
        },
        signature:
            "3044022064e7abe87c186b201eaeeb9587097432816c94b52b85520a70da1d78b93456aa0220205e263a278c64771d46038f116c37dc16c86e73664e7e829951d7c5544c6d3e",
        amount: Bignum.ZERO,
        recipientId: "DSD9Wi2rfqzDb3REUB5MELQGrsUAjY67gj",
        id: "e5a4cf622a24d459987f093e14a14c6b0492834358f86099afe1a2d14457cf31",
    };

    errors = [];
});

describe("SecondSignatureHandler", () => {
    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canApply(wallet, transaction, errors)).toBeTrue();

            expect(errors).toBeEmpty();
        });

        it("should be false if wallet already has a second signature", () => {
            wallet.secondPublicKey = "02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8";

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Wallet already has a second signature");
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Bignum.ZERO;

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Insufficient balance in the wallet");
        });
    });

    describe("apply", () => {
        it("should apply second signature registration", () => {
            expect(handler.canApply(wallet, transaction, [])).toBeTrue();

            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");
        });

        it("should be invalid to apply a second signature registration twice", () => {
            expect(handler.canApply(wallet, transaction, errors)).toBeTrue();
            expect(errors).toBeEmpty();

            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Wallet already has a second signature");
        });
    });

    describe("revert", () => {
        it("should be ok", () => {
            expect(wallet.secondPublicKey).toBeUndefined();

            expect(handler.canApply(wallet, transaction, [])).toBeTrue();

            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.secondPublicKey).toBe("02d5cfcbc4920d041d2a54b29e1f69173536796fd50f62af0f88ad6adc6df07cb8");

            handler.revertTransactionForSender(wallet, transaction);

            expect(wallet.secondPublicKey).toBeUndefined();
        });
    });
});
