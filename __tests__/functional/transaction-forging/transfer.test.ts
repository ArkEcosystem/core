import { Identities, Managers } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Transfer", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transaction = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .createOne();

        await expect(transaction).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transaction.id).toBeForged();
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Funds to register a second passphrase
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
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

        // Submit a transfer with 2 passprhases
        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrasePair(support.passphrases)
            .createOne();

        await expect(transfer).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transfer.id).toBeForged();
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

        // Create outgoing multi signature wallet transfer
        const multiSigTransfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 10 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(multiSigTransfer).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(multiSigTransfer.id).toBeForged();
    });

    it("should broadcast, accept and forge it [Expiration]", async () => {
        await support.snoozeForBlock(1);

        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withExpiration(support.getLastHeight() + 2)
            .withPassphrase(secrets[0])
            .createOne();

        await expect(transfer).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transfer.id).toBeForged();
    });

    it("should not broadcast, accept and forge it [Expired]", async () => {
        await support.snoozeForBlock(1);

        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .withExpiration(support.getLastHeight())
            .createOne();

        const transfer2 = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[1])
            .withExpiration(support.getLastHeight() + 1)
            .createOne();

        await expect(transfer).toBeRejected();
        await expect(transfer2).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(transfer.id).not.toBeForged();
    });

    it("should accept V1 before AIP11 milestone and reject after AIP11 milestone", async () => {
        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .createOne();

        await expect(transfer).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transfer.id).toBeForged();

        const transfersLegacyWithoutNonce = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withVersion(1)
            .withPassphrase(secrets[0])
            .create(2);

        Managers.configManager.getMilestone(2).aip11 = false;

        support.injectMilestone(2, {
            height: support.getLastHeight() + 1,
            aip11: true,
        });

        // Still accepts 1 height before milestone
        await expect(transfersLegacyWithoutNonce[0]).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transfersLegacyWithoutNonce[0].id).toBeForged();

        // Now got activated
        expect(Managers.configManager.getMilestone().aip11).toBeTrue();

        // Rejects V1
        await expect(transfersLegacyWithoutNonce[1]).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(transfersLegacyWithoutNonce[1].id).not.toBeForged();

        // and accepts V2
        const transferWithNonce = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[1])
            .createOne();

        expect(transferWithNonce.version).toBe(2);
        await expect(transferWithNonce).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transferWithNonce.id).toBeForged();
    });
});
