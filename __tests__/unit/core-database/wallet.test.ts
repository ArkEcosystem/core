import "jest-extended";

import { Bignum, configManager, constants } from "@arkecosystem/crypto";
import { Wallet } from "../../../packages/core-database/src";
import { TransactionFactory } from "../../helpers/transaction-factory";

const { SATOSHI, TransactionTypes } = constants;

describe("Models - Wallet", () => {
    beforeEach(() => configManager.setFromPreset("devnet"));

    describe("toString", () => {
        // TODO implementation is right?
        it("returns the address and the balance", () => {
            const address = "Abcde";
            const wallet = new Wallet(address);
            const balance = +(Math.random() * 1000).toFixed(8);
            wallet.balance = new Bignum(balance * SATOSHI);
            expect(wallet.toString()).toBe(`${address} (${balance} ${configManager.config.client.symbol})`);
        });
    });

    describe("apply block", () => {
        let testWallet;
        let block;

        beforeEach(() => {
            testWallet = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");
            testWallet.publicKey = "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece";
            testWallet.balance = Bignum.ZERO;
            testWallet.producedBlocks = 0;
            testWallet.forgedFees = Bignum.ZERO;
            testWallet.forgedRewards = Bignum.ZERO;
            testWallet.lastBlock = null;

            block = {
                id: 1,
                generatorPublicKey: testWallet.publicKey,
                reward: new Bignum(1000000000),
                totalFee: new Bignum(1000000000),
            };
        });

        it("should apply correct block", () => {
            testWallet.applyBlock(block);
            expect(testWallet.balance).toEqual(block.reward.plus(block.totalFee));
            expect(testWallet.producedBlocks).toBe(1);
            expect(testWallet.forgedFees).toEqual(block.totalFee);
            expect(testWallet.forgedRewards).toEqual(block.totalFee);
            expect(testWallet.lastBlock).toBeObject();
            expect(testWallet.dirty).toBeTrue();
        });

        it("should not apply incorrect block", () => {
            block.generatorPublicKey = ("a" as any).repeat(66);
            const originalWallet = Object.assign({}, testWallet);
            testWallet.applyBlock(block);
            expect(testWallet.balance).toEqual(originalWallet.balance);
            expect(testWallet.producedBlocks).toBe(0);
            expect(testWallet.forgedFees).toEqual(originalWallet.forgedFees);
            expect(testWallet.forgedRewards).toEqual(originalWallet.forgedRewards);
            expect(testWallet.lastBlock).toBe(originalWallet.lastBlock);
            expect(testWallet.dirty).toBeTrue();
        });
    });

    describe("revert block", () => {
        const walletInit = {
            balance: new Bignum(1000 * SATOSHI),
            forgedFees: new Bignum(10 * SATOSHI),
            forgedRewards: new Bignum(50 * SATOSHI),
            producedBlocks: 1,
            dirty: false,
            lastBlock: { id: 1234856 },
            publicKey: "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece",
            address: "D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7",
        };
        const block = {
            id: 1,
            generatorPublicKey: walletInit.publicKey,
            reward: new Bignum(2 * SATOSHI),
            totalFee: new Bignum(1 * SATOSHI),
        };
        let testWallet;

        beforeEach(() => {
            testWallet = new Wallet(walletInit.address);
            testWallet = Object.assign(testWallet, walletInit);
        });

        it("should revert block if generator public key matches the wallet public key", () => {
            const success = testWallet.revertBlock(block);

            expect(success).toBeTrue();
            expect(testWallet.balance).toEqual(walletInit.balance.minus(block.reward).minus(block.totalFee));
            expect(testWallet.producedBlocks).toBe(walletInit.producedBlocks - 1);
            expect(testWallet.forgedFees).toEqual(walletInit.forgedFees.minus(block.totalFee));
            expect(testWallet.forgedRewards).toEqual(walletInit.forgedRewards.minus(block.reward));
            expect(testWallet.lastBlock).toBeNull();
            expect(testWallet.dirty).toBeTrue();
        });

        it("should revert block if generator public key matches the wallet address", () => {
            testWallet.publicKey = undefined;
            const success = testWallet.revertBlock(block);

            expect(success).toBeTrue();
            expect(testWallet.balance).toEqual(walletInit.balance.minus(block.reward).minus(block.totalFee));
            expect(testWallet.producedBlocks).toBe(walletInit.producedBlocks - 1);
            expect(testWallet.forgedFees).toEqual(walletInit.forgedFees.minus(block.totalFee));
            expect(testWallet.forgedRewards).toEqual(walletInit.forgedRewards.minus(block.reward));
            expect(testWallet.lastBlock).toBeNull();
            expect(testWallet.dirty).toBeTrue();
        });

        it("should not revert block if generator public key doesn't match the wallet address / publicKey", () => {
            const invalidWallet = Object.assign({}, walletInit, { publicKey: undefined, address: undefined });
            testWallet = Object.assign(testWallet, invalidWallet);
            const success = testWallet.revertBlock(block);

            expect(success).toBeFalse();
            for (const key of Object.keys(invalidWallet)) {
                expect(testWallet[key]).toBe(invalidWallet[key]);
            }
        });
    });

    describe("audit transaction - auditApply", () => {
        const walletInit = {
            balance: new Bignum(1000 * SATOSHI),
            forgedFees: new Bignum(10 * SATOSHI),
            forgedRewards: new Bignum(50 * SATOSHI),
            producedBlocks: 1,
            dirty: false,
            lastBlock: { id: 1234856 },
            publicKey: "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece",
            address: "D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7",
        };
        let testWallet;

        const generateTransactionType = (type, asset = {}) => {
            // use 2nd signature as a base
            const transaction = TransactionFactory.secondSignature()
                .withNetwork("devnet")
                .withPassphrase("super secret passphrase")
                .create()[0];
            return Object.assign(transaction, { type, asset });
        };

        beforeEach(() => {
            testWallet = new Wallet(walletInit.address);
            testWallet = Object.assign(testWallet, walletInit);
        });

        it("should return correct audit data for Transfer type", () => {
            const transaction = TransactionFactory.transfer("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7")
                .withNetwork("devnet")
                .withPassphrase("super secret passphrase")
                .create()[0];
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": true },
                { Transfer: true },
            ]);
        });

        it("should return correct audit data for 2nd signature type", () => {
            const transaction = TransactionFactory.secondSignature()
                .withNetwork("devnet")
                .withPassphrase("super secret passphrase")
                .create()[0];
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": true },
                { "Second public key": null },
            ]);
        });

        it("should return correct audit data for delegate registration type", () => {
            const transaction = TransactionFactory.delegateRegistration()
                .withNetwork("devnet")
                .withPassphrase("super secret passphrase")
                .create()[0];
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": true },
                { "Current username": null },
                { "New username": transaction.asset.delegate.username },
            ]);
        });

        it("should return correct audit data for vote type", () => {
            const transaction = TransactionFactory.vote(
                "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece",
            )
                .withNetwork("devnet")
                .withPassphrase("super secret passphrase")
                .create()[0];
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": true },
                { "Current vote": null },
                { "New vote": transaction.asset.votes[0] },
            ]);
        });

        it("should return correct audit data for multisignature type", () => {
            const asset = {
                multisignature: {
                    keysgroup: ["first", "second", "third"],
                    min: 2,
                    lifetime: 1000,
                },
            };
            const transaction = generateTransactionType(TransactionTypes.MultiSignature, asset);
            transaction.signatures = [];
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { "Multisignature not yet registered": true },
                { "Multisignature enough keys": true },
                { "Multisignature all keys signed": false },
                { "Multisignature verification": false },
            ]);
        });

        it("should return correct audit data for ipfs type", () => {
            const transaction = generateTransactionType(TransactionTypes.Ipfs);
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { IPFS: true },
            ]);
        });

        it("should return correct audit data for timelock type", () => {
            const transaction = generateTransactionType(TransactionTypes.TimelockTransfer);
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { Timelock: true },
            ]);
        });

        it("should return correct audit data for multipayment type", () => {
            const asset = {
                payments: [{ amount: new Bignum(10) }, { amount: new Bignum(20) }],
            };
            const transaction = generateTransactionType(TransactionTypes.MultiPayment, asset);
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { "Multipayment remaining amount": new Bignum(30) },
            ]);
        });

        it("should return correct audit data for delegate resignation type", () => {
            const transaction = generateTransactionType(TransactionTypes.DelegateResignation);
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { "Resignate Delegate": null },
            ]);
        });

        it("should return correct audit data for unknown type", () => {
            const transaction = generateTransactionType(99);
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { "Unknown Type": true },
            ]);
        });

        describe("when wallet has multisignature", () => {
            it("should return correct audit data for Transfer type", () => {
                const transaction = TransactionFactory.transfer("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7")
                    .withNetwork("devnet")
                    .withPassphrase("super secret passphrase")
                    .create()[0];
                testWallet.multisignature = {
                    keysgroup: [
                        "+02db1d199f20038e569500895b3521a453b2924e4a07c75aa9f7bf2aa4ad71392d",
                        "+02a7442df1f6cbef57d84c9c0eff248f9af48370384987de90bdcebd000feccdb6",
                        "+037a9458c87080768f79c4320941fdc64c9fe580673f17358125b93e80bd0b1d27",
                    ],
                    min: 2,
                };
                transaction.signatures = [
                    "3044022022fb3b1d48d9e4905ab566949d637f0832dd0ab6f2cb67a620496e23e83a86d902203182ad967d22db258f97f9fab6d3856c29738ae745eb2f40eb5d472722b794b9",
                    "3045022100aef482ecaea6ecaf8e6f86bd7ac474458e657614b3eb9e440789549d1ea85f6002205c75763411e0febb7d11a7ccf7cb826fc11ddbe3722b73f77e22e9f0919e179d",
                    "3045022100e1dff5c0a4289ffee8caa79fd25fe86f0ded4daaeb9f25e123ea327b01fdb9710220476da4d177652fe4a375e414089ce8c86800bcc4ca6ce0b6d974ef98d8c9d4cf",
                ];
                const audit = testWallet.auditApply(transaction);

                expect(audit).toEqual([{ Mutisignature: false }, { Transfer: true }]);
            });
        });

        describe("when wallet has 2nd public key", () => {
            it("should return correct audit data for Transfer type", () => {
                const transaction = TransactionFactory.transfer("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7")
                    .withNetwork("devnet")
                    .withPassphrases({
                        passphrase: "super secret passphrase",
                        secondPassphrase: "super secret secondpassphrase",
                    })
                    .create()[0];
                testWallet.secondPublicKey = "02db1d199f20038e569500895b3521a453b2924e4a07c75aa9f7bf2aa4ad71392d";

                const audit = testWallet.auditApply(transaction);

                expect(audit).toEqual([
                    {
                        "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                    },
                    { "Signature validation": true },
                    { "Second Signature Verification": false },
                    { Transfer: true },
                ]);
            });
        });
    });
});
