import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Second Signature Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        const secondSignature = TransactionFactory.secondSignature(support.passphrases.secondPassphrase)
            .withPassphrase(secrets[0])
            .create();

        await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(secondSignature[0].id);
    });

    it("should not broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[1])
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
            .withPassphrase(secrets[1])
            .create();

        await support.expectAcceptAndBroadcast(multiSignatureFunds, multiSignatureFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(multiSignatureFunds[0].id);

        // Create second signature registration
        const secondSignature = TransactionFactory.secondSignature(support.passphrases.secondPassphrase)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .create();

        await support.expectInvalidAndError(secondSignature, secondSignature[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionNotForged(secondSignature[0].id);

        // Create transfer to assert multi sig wallet can still send funds
        const transfer = TransactionFactory.transfer(multiSigAddress, 18 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .create();

        await support.expectAcceptAndBroadcast(transfer, transfer[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transfer[0].id);
    });
});
