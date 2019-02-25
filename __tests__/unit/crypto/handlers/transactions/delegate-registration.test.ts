import "jest-extended";
import { DelegateRegistrationHandler } from "../../../../../packages/crypto/src/handlers/transactions/delegate-registration";
import { Bignum } from "../../../../../packages/crypto/src/utils";
import { wallet as originalWallet } from "./__fixtures__/wallet";

const handler = new DelegateRegistrationHandler();

let wallet;
let transaction;
let errors;

beforeEach(() => {
    wallet = originalWallet;

    transaction = {
        version: 1,
        id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        blockid: "11233167632577333611",
        type: 2,
        timestamp: 36482198,
        amount: Bignum.ZERO,
        fee: new Bignum(10000000),
        senderId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
        recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
        senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
        signature:
            "304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b",
        asset: {
            delegate: {
                username: "dummy",
                publicKey: ("a" as any).repeat(66),
            },
        },
    };

    errors = [];
});

describe("DelegateRegistrationHandler", () => {
    describe("canApply", () => {
        it("should be true", () => {
            expect(handler.canApply(wallet, transaction, [])).toBeTrue();
        });

        it("should be false if wallet already registered a username", () => {
            wallet.username = "dummy";

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Wallet already has a registered username");
        });

        it("should be false if wallet has insufficient funds", () => {
            wallet.balance = Bignum.ZERO;

            expect(handler.canApply(wallet, transaction, errors)).toBeFalse();
            expect(errors).toContain("Insufficient balance in the wallet");
        });
    });

    describe("apply", () => {
        it("should set username", () => {
            handler.applyTransactionToSender(wallet, transaction);

            expect(wallet.username).toBe("dummy");
        });
    });

    describe("revert", () => {
        it("should unset username", () => {
            handler.revertTransactionForSender(wallet, transaction);

            expect(wallet.username).toBeNull();
        });
    });
});
