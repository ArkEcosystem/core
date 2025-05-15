import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import { generateMnemonic } from "bip39";

import * as support from "./__support__";

const genesisPassphrase: string = secrets[0];

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Transaction Forging - Bls Public Key Registration", () => {
    describe("Signed with 1 Passphase", () => {
        it("should broadcast, accept and forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.initialize(app)
                .delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Register bls public key
            const transactionsRegisterFirst = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "a".repeat(96),
                })
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegisterFirst).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegisterFirst.id).toBeForged();
            await expect(transactionsRegisterFirst).blsPublicKeyRegistered();

            // Overwrite bls public key
            const transactionsRegisterSecond = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    oldBlsPublicKey: "a".repeat(96),
                    newBlsPublicKey: "b".repeat(96),
                })
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegisterSecond).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegisterSecond.id).toBeForged();
            await expect(transactionsRegisterSecond).blsPublicKeyRegistered();
        });

        it("should reject if bls key is already registered", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.initialize(app)
                .delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Register bls public key
            const transactionsRegisterFirst = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "b".repeat(96),
                })
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegisterFirst).toBeRejected();
            await snoozeForBlock(1);
            await expect(transactionsRegisterFirst.id).not.toBeForged();
            await expect(transactionsRegisterFirst).not.blsPublicKeyRegistered();
        });

        it("should reject if delegate is resiged", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.initialize(app)
                .delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Resign a delegate
            const transactionsResign = TransactionFactory.initialize(app)
                .delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsResign.id).toBeForged();

            // Register bls public key
            const transactionsRegisterFirst = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "f".repeat(96),
                })
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegisterFirst).toBeRejected();
            await snoozeForBlock(1);
            await expect(transactionsRegisterFirst.id).not.toBeForged();
            await expect(transactionsRegisterFirst).not.blsPublicKeyRegistered();
        });

        it("should reject if not from delegate", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register bls public key
            const transactionsRegisterFirst = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "g".repeat(96),
                })
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegisterFirst).toBeRejected();
            await snoozeForBlock(1);
            await expect(transactionsRegisterFirst.id).not.toBeForged();
            await expect(transactionsRegisterFirst).not.blsPublicKeyRegistered();
        });
    });

    describe("Signed with 2 Passphases", () => {
        it("should broadcast, accept and forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.initialize(app)
                .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.initialize(app)
                .secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.initialize(app)
                .delegateRegistration()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Register bls public key
            const transactionsRegisterFirst = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    newBlsPublicKey: "c".repeat(96),
                })
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsRegisterFirst).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegisterFirst.id).toBeForged();
            await expect(transactionsRegisterFirst).blsPublicKeyRegistered();

            // Register bls public key
            const transactionsRegisterSecond = TransactionFactory.initialize(app)
                .blsPublicKeyRegistration({
                    oldBlsPublicKey: "c".repeat(96),
                    newBlsPublicKey: "d".repeat(96),
                })
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsRegisterSecond).toBeAccepted();
            await snoozeForBlock(1);
            await expect(transactionsRegisterSecond.id).toBeForged();
            await expect(transactionsRegisterSecond).blsPublicKeyRegistered();
        });
    });
});
