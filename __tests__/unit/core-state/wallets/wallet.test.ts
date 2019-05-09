import "jest-extended";

import { Constants, Enums, Managers, Utils } from "@arkecosystem/crypto";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { Wallet } from "../../../../packages/core-state/src/wallets";
import { TransactionFactory } from "../../../helpers/transaction-factory";

const { SATOSHI } = Constants;
const { TransactionTypes } = Enums;

describe("Models - Wallet", () => {
    beforeEach(() => Managers.configManager.setFromPreset("devnet"));

    describe("toString", () => {
        // TODO implementation is right?
        it("returns the address and the balance", () => {
            const address = "Abcde";
            const wallet = new Wallet(address);
            const balance = +(Math.random() * 1000).toFixed(8);
            wallet.balance = Utils.BigNumber.make(balance * SATOSHI);
            expect(wallet.toString()).toBe(
                `${address} (${balance} ${Managers.configManager.get("network.client.symbol")})`,
            );
        });
    });

    describe("apply block", () => {
        let testWallet: Wallet;
        let block;

        beforeEach(() => {
            testWallet = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");
            testWallet.publicKey = "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece";
            testWallet.balance = Utils.BigNumber.ZERO;
            testWallet.producedBlocks = 0;
            testWallet.forgedFees = Utils.BigNumber.ZERO;
            testWallet.forgedRewards = Utils.BigNumber.ZERO;
            testWallet.lastBlock = undefined;

            block = {
                id: 1,
                generatorPublicKey: testWallet.publicKey,
                reward: Utils.BigNumber.make(1000000000),
                totalFee: Utils.BigNumber.make(1000000000),
            };
        });

        it("should apply correct block", () => {
            testWallet.applyBlock(block);
            expect(testWallet.balance).toEqual(block.reward.plus(block.totalFee));
            expect(testWallet.producedBlocks).toBe(1);
            expect(testWallet.forgedFees).toEqual(block.totalFee);
            expect(testWallet.forgedRewards).toEqual(block.totalFee);
            expect(testWallet.lastBlock).toBeObject();
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
        });
    });

    describe("revert block", () => {
        const walletInit = {
            balance: Utils.BigNumber.make(1000 * SATOSHI),
            forgedFees: Utils.BigNumber.make(10 * SATOSHI),
            forgedRewards: Utils.BigNumber.make(50 * SATOSHI),
            producedBlocks: 1,
            dirty: false,
            lastBlock: { id: 1234856 },
            publicKey: "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece",
            address: "D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7",
        };
        const block = {
            id: 1,
            generatorPublicKey: walletInit.publicKey,
            reward: Utils.BigNumber.make(2 * SATOSHI),
            totalFee: Utils.BigNumber.make(1 * SATOSHI),
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
            expect(testWallet.lastBlock).toBeUndefined();
        });

        it("should revert block if generator public key matches the wallet address", () => {
            testWallet.publicKey = undefined;
            const success = testWallet.revertBlock(block);

            expect(success).toBeTrue();
            expect(testWallet.balance).toEqual(walletInit.balance.minus(block.reward).minus(block.totalFee));
            expect(testWallet.producedBlocks).toBe(walletInit.producedBlocks - 1);
            expect(testWallet.forgedFees).toEqual(walletInit.forgedFees.minus(block.totalFee));
            expect(testWallet.forgedRewards).toEqual(walletInit.forgedRewards.minus(block.reward));
            expect(testWallet.lastBlock).toBeUndefined();
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
            balance: Utils.BigNumber.make(1000 * SATOSHI),
            forgedFees: Utils.BigNumber.make(10 * SATOSHI),
            forgedRewards: Utils.BigNumber.make(50 * SATOSHI),
            producedBlocks: 1,
            dirty: false,
            lastBlock: { id: 1234856 },
            publicKey: "02337316a26d8d49ec27059bd0589c49ba474029c3627715380f4df83fb431aece",
            address: "D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7",
        };
        let testWallet;

        const generateTransactionType = (type, version = 1, asset = {}) => {
            // use 2nd signature as a base
            const transaction = TransactionFactory.secondSignature()
                .withVersion(version)
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
                { "Second public key": undefined },
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
                { "Current username": undefined },
                { "New username": transaction.asset.delegate.username },
            ]);
        });

        it("should return correct audit data for delegate resignation type", () => {
            const transaction = TransactionFactory.delegateResignation()
                .withNetwork("devnet")
                .withPassphrase("super secret passphrase")
                .create()[0];
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": true },
                { "Resigned delegate": testWallet.username },
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
                { "Current vote": undefined },
                { "New vote": transaction.asset.votes[0] },
            ]);
        });

        it.skip("should return correct audit data for multisignature type", () => {
            const asset = {
                multiSignature: {
                    publicKeys: ["first", "second", "third"],
                    min: 2,
                },
            };
            const transaction = generateTransactionType(TransactionTypes.MultiSignature, 2, asset);
            transaction.version = 2;
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
                payments: [{ amount: Utils.BigNumber.make(10) }, { amount: Utils.BigNumber.make(20) }],
            };
            const transaction = generateTransactionType(TransactionTypes.MultiPayment, 1, asset);
            const audit = testWallet.auditApply(transaction);

            expect(audit).toEqual([
                {
                    "Remaining amount": +walletInit.balance.minus(transaction.amount).minus(transaction.fee),
                },
                { "Signature validation": false },
                { "Multipayment remaining amount": Utils.BigNumber.make(30) },
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
                { "Resignate Delegate": undefined },
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
                configManager.setFromPreset("testnet");
                const transaction = TransactionFactory.transfer("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7")
                    .withNetwork("devnet")
                    .withPassphrase("super secret passphrase")
                    .create()[0];

                testWallet.multisignature = {
                    min: 3,
                    publicKeys: [
                        "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22", // "secret 1"
                        "028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0", // "secret 2"
                        "021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd", // "secret 3"
                    ],
                };

                transaction.signatures = [
                    "00fdbdd94c1d87745adab815a3fda813c075098d9bbdd78446a2b52423e1a6dbdba4a3500bef58587d181fd4f48e96beafddf94feac144a277195fdbe49eeadc1b",
                    "01a2992c7964e4124823fef23de67cbfa6dab63b524cd354b4fe10225361777ed150b2c2e593c57f621057ab44b2974b002d796f358cbf9e4212e1eb9860139ad5",
                    "02b4c01931c273b3b00ee84b4c6149f23c545d6c53faac6a9963068285644c311769a8d037b439143665744bcf9d6107102bde174aaeb70a79abeb80f43aa090b4",
                ];

                const audit = testWallet.auditApply(transaction);
                expect(audit).toEqual([{ Mutisignature: false }, { Transfer: true }]);

                configManager.setFromPreset("devnet");
            });
        });

        describe("when wallet has 2nd public key", () => {
            it("should return correct audit data for Transfer type", () => {
                const transaction = TransactionFactory.transfer("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7")
                    .withNetwork("devnet")
                    .withPassphrasePair({
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
