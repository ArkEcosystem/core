import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Delegate Resignation", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
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

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
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
        const delegateResignation = TransactionFactory.delegateResignation()
            .withPassphrasePair({ passphrase, secondPassphrase })
            .create();

        await support.expectAcceptAndBroadcast(delegateResignation, delegateResignation[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(delegateResignation[0].id);

        // Resign a delegate
        const transactionsResign = TransactionFactory.delegateResignation()
            .withPassphrasePair({ passphrase, secondPassphrase })
            .create();

        await support.expectAcceptAndBroadcast(transactionsResign, transactionsResign[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactionsResign[0].id);
    });
});
