import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const genesisPassphrase: string = secrets[0];

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Delegate Resignation", () => {
    describe("Signed with 1 Passphase", () => {
        it("should broadcast, accept and forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsResign.id).toBeForged();
        });

        it("should broadcast, reject and not forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(transactionsResign.id).not.toBeForged();
        });

        it("should broadcast, reject and not forge it if the delegate already resigned", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Resign a delegate
            const transactionsResign1 = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign1).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsResign1.id).toBeForged();

            // Resign a delegate
            const transactionsResign2 = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign2).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(transactionsResign2.id).not.toBeForged();
        });

        it("should broadcast, reject and not forge it if not enough delegates", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            const walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

            const takenDelegates = walletManager.allByUsername().slice(0, 50);
            for (const delegate of takenDelegates) {
                walletManager.forgetByUsername(delegate.getAttribute("delegate.username"));
            }

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(transactionsResign).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(transactionsResign.id).not.toBeForged();

            for (const delegate of takenDelegates) {
                walletManager.reindex(delegate);
            }
        });
    });

    describe("Signed with 2 Passphases", () => {
        it("should broadcast, accept and forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsResign).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsResign.id).toBeForged();
        });

        it("should broadcast, reject and not forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsResign).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(transactionsResign.id).not.toBeForged();
        });

        it("should broadcast, reject and not forge it if the delegate already resigned", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .createOne();

            await expect(secondSignature).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(secondSignature.id).toBeForged();

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsRegister).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsRegister.id).toBeForged();

            // Resign a delegate
            const transactionsResign1 = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsResign1).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(transactionsResign1.id).toBeForged();

            // Resign a delegate
            const transactionsResign2 = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .createOne();

            await expect(transactionsResign2).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(transactionsResign2.id).not.toBeForged();
        });
    });
});
