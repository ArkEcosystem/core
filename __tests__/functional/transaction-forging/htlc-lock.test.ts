import { Crypto, Enums, Identities, Utils } from "@arkecosystem/crypto";
import got from "got";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

const { EpochTimestamp } = Enums.HtlcLockExpirationType;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - HTLC Lock", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Submit htlc lock transaction
        const transaction = TransactionFactory.htlcLock({
            secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
            expiration: {
                type: EpochTimestamp,
                value: Crypto.Slots.getTime() + 1000,
            },
        })
            .withPassphrase(passphrase)
            .createOne();

        await expect(transaction).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
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

        // Submit htlc lock transaction
        const transaction = TransactionFactory.htlcLock({
            secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
            expiration: {
                type: EpochTimestamp,
                value: Crypto.Slots.getTime() + 1000,
            },
        })
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(transaction).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
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

        // Submit htlc lock transaction
        const transaction = TransactionFactory.htlcLock({
            secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
            expiration: {
                type: EpochTimestamp,
                value: Crypto.Slots.getTime() + 1000,
            },
        })
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transaction).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
    });

    it("should update delegates vote balance using locked balance when voting and unvoting delegates", async () => {
        const newWalletPassphrase = "this is a new wallet passphrase";
        // Initial Funds
        const initialBalance = 100 * 1e8;
        const initialFunds = TransactionFactory.transfer(
            Identities.Address.fromPassphrase(newWalletPassphrase),
            initialBalance,
        )
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        const delegateToVote = Identities.PublicKey.fromPassphrase(secrets[9]);
        const { body } = await got.get(`http://localhost:4003/api/v2/delegates/${delegateToVote}`);
        const parsedBody = JSON.parse(body);
        const initialDelegateVoteValance = Utils.BigNumber.make(parsedBody.data.votes);

        // Submit a vote
        const vote = TransactionFactory.vote(delegateToVote)
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(vote).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(vote.id).toBeForged();

        const expectedBalanceAfterVote = initialDelegateVoteValance.plus(initialBalance).minus(vote.fee);
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterVote.toString());

        // Submit htlc lock transaction
        const lockTransaction = TransactionFactory.htlcLock({
            secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
            expiration: {
                type: EpochTimestamp,
                value: Crypto.Slots.getTime() + 1000,
            },
        })
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(lockTransaction).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(lockTransaction.id).toBeForged();

        const expectedBalanceAfterLock = expectedBalanceAfterVote.minus(lockTransaction.fee);
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterLock.toString());

        // Unvote
        const unvote = TransactionFactory.unvote(delegateToVote)
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(unvote).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(unvote.id).toBeForged();

        const expectedBalanceAfterUnvote = initialDelegateVoteValance;
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterUnvote.toString());

        // Vote again
        const voteAgain = TransactionFactory.vote(delegateToVote)
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(voteAgain).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(voteAgain.id).toBeForged();

        const expectedBalanceAfterVoteAgain = expectedBalanceAfterLock.minus(unvote.fee).minus(voteAgain.fee);
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterVoteAgain.toString());
    });
});
