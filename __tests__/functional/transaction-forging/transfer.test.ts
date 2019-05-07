import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Transfer", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphrases]", async () => {
        // Funds to register a second passphrase
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 50 * 1e8)
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

        // Submit a transfer with 2 passprhases
        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrasePair(support.passphrases)
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });

    it("should broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

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
            .create();

        await support.expectAcceptAndBroadcast(multiSignature, multiSignature[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSignature[0].id);

        // Send funds to multi signature wallet
        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(multiSignature[0].asset.multiSignature);
        const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(multiSignature[0].asset.multiSignature);

        const multiSignatureFunds = TransactionFactory.transfer(multiSigAddress, 20 * 1e8)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(multiSignatureFunds, multiSignatureFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSignatureFunds[0].id);

        // Create outgoing multi signature wallet transfer
        const multiSigTransfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase), 10 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .create();

        await support.expectAcceptAndBroadcast(multiSigTransfer, multiSigTransfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSigTransfer[0].id);
    });

    it("should broadcast, accept and forge it [Expiration]", async () => {
        await support.snoozeForBlock(1);

        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withExpiration(support.getLastHeight() + 2)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });

    it("should not broadcast, accept and forge it [Expired]", async () => {
        await support.snoozeForBlock(1);

        const transfer = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[0])
            .withExpiration(support.getLastHeight())
            .create();

        const transfer2 = TransactionFactory.transfer(Identities.Address.fromPassphrase(passphrase))
            .withPassphrase(secrets[1])
            .withExpiration(support.getLastHeight() + 1)
            .create();

        await support.expectInvalidAndError(transfer, transfer[0].id);
        await support.expectInvalidAndError(transfer2, transfer2[0].id);

        await support.snoozeForBlock(1);
        await support.expectTransactionNotForged(transfer[0].id);
    });
});
