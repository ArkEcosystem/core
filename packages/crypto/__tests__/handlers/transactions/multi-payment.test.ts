import "jest-extended";

import sumBy from "lodash/sumBy";
import { MultiPaymentHandler } from "../../../src/handlers/transactions/multi-payment";
import { Bignum } from "../../../src/utils/bignum";
import { transaction as originalTransaction } from "./__fixtures__/transaction";
import { wallet as originalWallet } from "./__fixtures__/wallet";

const handler = new MultiPaymentHandler();

let wallet;
let transaction;

beforeEach(() => {
    wallet = originalWallet;

    transaction = {
        version: 1,
        id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        blockid: "11233167632577333611",
        type: 7,
        timestamp: 36482198,
        amount: new Bignum(100000000),
        fee: new Bignum(10000000),
        senderId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
        recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
        senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
        signature:
            "304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b",
        asset: {
            payments: [
                {
                    amount: new Bignum(10),
                    recipientId: "a",
                },
                {
                    amount: new Bignum(20),
                    recipientId: "b",
                },
                {
                    amount: new Bignum(30),
                    recipientId: "c",
                },
                {
                    amount: new Bignum(40),
                    recipientId: "d",
                },
                {
                    amount: new Bignum(50),
                    recipientId: "e",
                },
            ],
        },
    };
});

describe("MultiPaymentHandler", () => {
    it("should be instantiated", () => {
        expect(handler.constructor.name).toBe("MultiPaymentHandler");
    });

    describe("canApply", () => {
        it("should be true", () => {
            const amount = sumBy(transaction.asset.payments, (payment: any) => payment.amount.toFixed());

            expect(handler.canApply(wallet, transaction, [])).toBeTrue();
        });

        it("should be false if wallet has insufficient balance", () => {
            const amount = sumBy(transaction.asset.payments, (payment: any) => payment.amount.toFixed());

            wallet.balance = Bignum.ZERO;
            const errors = [];

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Insufficient balance in the wallet");
        });
    });
});
