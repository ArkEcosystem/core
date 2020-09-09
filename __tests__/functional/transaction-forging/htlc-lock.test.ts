import "@packages/core-test-framework/src/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Identities, Utils } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";
import { ApiHelpers, snoozeForBlock, TransactionFactory } from "@packages/core-test-framework/src/utils";
import got from "got";

import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

const { EpochTimestamp } = Enums.HtlcLockExpirationType;

let app: Contracts.Kernel.Application;
let apiHelpers: ApiHelpers;
beforeAll(async () => {
    app = await support.setUp();
    apiHelpers = new ApiHelpers(app);
});
afterAll(async () => await support.tearDown());

describe("Transaction Forging - HTLC Lock", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Submit htlc lock transaction
        const transaction = TransactionFactory.initialize(app)
            .htlcLock({
                secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
                expiration: {
                    type: EpochTimestamp,
                    value: Crypto.Slots.getTime() + 1000,
                },
            })
            .withPassphrase(passphrase)
            .createOne();

        await expect(transaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(passphrase), 100 * 1e8)
            .withPassphrase(secrets[0])
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

        // Submit htlc lock transaction
        const transaction = TransactionFactory.initialize(app)
            .htlcLock({
                secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
                expiration: {
                    type: EpochTimestamp,
                    value: Crypto.Slots.getTime() + 1000,
                },
            })
            .withPassphrasePair({ passphrase, secondPassphrase })
            .createOne();

        await expect(transaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        // Register a multi signature wallet with defaults
        const passphrases = [secrets[3], secrets[4], secrets[5]];
        const participants = [
            Identities.PublicKey.fromPassphrase(passphrases[0]),
            Identities.PublicKey.fromPassphrase(passphrases[1]),
            Identities.PublicKey.fromPassphrase(passphrases[2]),
        ];

        const multiSignature = TransactionFactory.initialize(app)
            .multiSignature(participants, 3)
            .withPassphrase(secrets[3])
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSignature).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignature.id).toBeForged();

        // Send funds to multi signature wallet
        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature.asset.multiSignature);
        const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature.asset.multiSignature);

        const multiSignatureFunds = TransactionFactory.initialize(app)
            .transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Submit htlc lock transaction
        const transaction = TransactionFactory.initialize(app)
            .htlcLock({
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
        await snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
    });

    it("should update delegates vote balance using locked balance when voting and unvoting delegates", async () => {
        const newWalletPassphrase = "this is a new wallet passphrase";
        // Initial Funds
        const initialBalance = 100 * 1e8;
        const initialFunds = TransactionFactory.initialize(app)
            .transfer(Identities.Address.fromPassphrase(newWalletPassphrase), initialBalance)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(initialFunds).toBeAccepted();
        await snoozeForBlock(1);
        await expect(initialFunds.id).toBeForged();

        const delegateToVote = Identities.PublicKey.fromPassphrase(secrets[9]);
        const { body } = await got.get(`http://localhost:4003/api/delegates/${delegateToVote}`);
        const parsedBody = JSON.parse(body);
        const initialDelegateVoteBalance = Utils.BigNumber.make(parsedBody.data.votes);
        let collectedFees = Utils.BigNumber.ZERO;

        // Submit a vote
        const vote = TransactionFactory.initialize(app)
            .vote(delegateToVote)
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(vote).toBeAccepted();
        await snoozeForBlock(1);
        await expect(vote.id).toBeForged();

        if (await apiHelpers.isTransactionForgedByDelegate(vote.id!, delegateToVote)) {
            collectedFees = collectedFees.plus(vote.fee);
        }

        const expectedBalanceAfterVote = initialDelegateVoteBalance.plus(initialBalance).minus(vote.fee);
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterVote.plus(collectedFees).toString());

        // Submit htlc lock transaction
        const lockTransaction = TransactionFactory.initialize(app)
            .htlcLock({
                secretHash: "0f128d401958b1b30ad0d10406f47f9489321017b4614e6cb993fc63913c5454",
                expiration: {
                    type: EpochTimestamp,
                    value: Crypto.Slots.getTime() + 1000,
                },
            })
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(lockTransaction).toBeAccepted();
        await snoozeForBlock(1);
        await expect(lockTransaction.id).toBeForged();

        if (await apiHelpers.isTransactionForgedByDelegate(lockTransaction.id!, delegateToVote)) {
            collectedFees = collectedFees.plus(lockTransaction.fee);
        }

        const expectedBalanceAfterLock = expectedBalanceAfterVote.minus(lockTransaction.fee);
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterLock.plus(collectedFees).toString());

        // Unvote
        const unvote = TransactionFactory.initialize(app)
            .unvote(delegateToVote)
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(unvote).toBeAccepted();
        await snoozeForBlock(1);
        await expect(unvote.id).toBeForged();
        if (await apiHelpers.isTransactionForgedByDelegate(unvote.id!, delegateToVote)) {
            collectedFees = collectedFees.plus(unvote.fee);
        }

        const expectedBalanceAfterUnvote = initialDelegateVoteBalance;
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterUnvote.plus(collectedFees).toString());

        // Vote again
        const voteAgain = TransactionFactory.initialize(app)
            .vote(delegateToVote)
            .withPassphrase(newWalletPassphrase)
            .createOne();

        await expect(voteAgain).toBeAccepted();
        await snoozeForBlock(1);
        await expect(voteAgain.id).toBeForged();
        if (await apiHelpers.isTransactionForgedByDelegate(voteAgain.id!, delegateToVote)) {
            collectedFees = collectedFees.plus(voteAgain.fee);
        }

        const expectedBalanceAfterVoteAgain = expectedBalanceAfterLock.minus(unvote.fee).minus(voteAgain.fee);
        await expect(delegateToVote).toHaveVoteBalance(expectedBalanceAfterVoteAgain.plus(collectedFees).toString());
    });
});
