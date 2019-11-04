import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Vote", () => {
    describe("Signed with 1 Passphase", () => {
        it("should broadcast, accept and forge it", async () => {
            // Initial Funds
            const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
                .withPassphrase(secrets[0])
                .createOne();

            await expect(initialFunds).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(initialFunds.id).toBeForged();

            // Register a delegate
            const registration = TransactionFactory.delegateRegistration()
                .withPassphrase(passphrase)
                .createOne();

            await expect(registration).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(registration.id).toBeForged();

            // Submit a vote
            const vote = TransactionFactory.vote(Identities.PublicKey.fromPassphrase(passphrase))
                .withPassphrase(passphrase)
                .createOne();

            await expect(vote).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(vote.id).toBeForged();
        });

        it("should broadcast, accept and forge it if unvoting a resigned delegate", async () => {
            // Resign a delegate
            const resignation = TransactionFactory.delegateResignation()
                .withPassphrase(passphrase)
                .createOne();

            await expect(resignation).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(resignation.id).toBeForged();

            // Submit an unvote
            const unvote = TransactionFactory.unvote(Identities.PublicKey.fromPassphrase(passphrase))
                .withPassphrase(passphrase)
                .createOne();

            await expect(unvote).toBeAccepted();
            await support.snoozeForBlock(1);
            await expect(unvote.id).toBeForged();
        });

        it("should broadcast, reject and not forge it if voting for a resigned delegate", async () => {
            // Submit a vote
            const vote = TransactionFactory.vote(Identities.PublicKey.fromPassphrase(passphrase))
                .withPassphrase(passphrase)
                .createOne();

            await expect(vote).toBeRejected();
            await support.snoozeForBlock(1);
            await expect(vote.id).not.toBeForged();
        });
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
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

        // Submit a vote
        const vote = TransactionFactory.vote(Identities.PublicKey.fromPassphrase(secrets[0]))
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(vote).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(vote.id).toBeForged();
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [secrets[3], secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.multiSignature(participants, 3)
            .withPassphrase(secrets[3])
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(multiSignature.id).toBeForged();

        // Send funds to multi signature wallet
        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
        const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

        const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Submit a vote
        const voteTransaction = TransactionFactory.vote()
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(voteTransaction).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(voteTransaction.id).toBeForged();
    });
});
