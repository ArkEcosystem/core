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
                .create();

            await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(initialFunds[0].id);

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(transactionsRegister, transactionsRegister[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsRegister[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsResign[0].id);
        });

        it("should broadcast, reject and not forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .create();

            await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(initialFunds[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .create();

            await support.expectInvalidAndError(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionNotForged(transactionsResign[0].id);
        });

        it("should broadcast, reject and not forge it if the delegate already resigned", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .create();

            await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(initialFunds[0].id);

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(transactionsRegister, transactionsRegister[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsRegister[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsResign[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .create();

            await support.expectInvalidAndError(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionNotForged(transactionsResign[0].id);
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
                .create();

            await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(initialFunds[0].id);

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(secondSignature[0].id);

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .create();

            await support.expectAcceptAndBroadcast(transactionsRegister, transactionsRegister[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsRegister[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .create();

            await support.expectAcceptAndBroadcast(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsResign[0].id);
        });

        it("should broadcast, reject and not forge it", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .create();

            await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(initialFunds[0].id);

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(secondSignature[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .create();

            await support.expectInvalidAndError(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionNotForged(transactionsResign[0].id);
        });

        it("should broadcast, reject and not forge it if the delegate already resigned", async () => {
            // Prepare a fresh wallet for the tests
            const passphrase = generateMnemonic();
            const secondPassphrase = generateMnemonic();

            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(genesisPassphrase)
                .create();

            await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(initialFunds[0].id);

            // Register a second passphrase
            const secondSignature = TransactionFactory.secondSignature(secondPassphrase)
                .withPassphrase(passphrase)
                .create();

            await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(secondSignature[0].id);

            // Register a delegate
            const transactionsRegister = TransactionFactory.delegateRegistration()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .create();

            await support.expectAcceptAndBroadcast(transactionsRegister, transactionsRegister[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsRegister[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .create();

            await support.expectAcceptAndBroadcast(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionForged(transactionsResign[0].id);

            // Resign a delegate
            const transactionsResign = TransactionFactory.delegateResignation()
                .withPassphrasePair({ passphrase, secondPassphrase })
                .create();

            await support.expectInvalidAndError(transactionsResign, transactionsResign[0].id);
            await support.snoozeForBlock(1);
            await support.expectTransactionNotForged(transactionsResign[0].id);
        });
    });
});
