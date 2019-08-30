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
            .createOne();

        await expect(secondSignature).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(secondSignature.id).toBeForged();
    });

    it("should not broadcast, accept and forge it [3-of-3 multisig]", async () => {
        // Funds to register a multi signature wallet
        const initialFunds = TransactionFactory.transfer(Identities.Address.fromPassphrase(secrets[3]), 50 * 1e8)
            .withPassphrase(secrets[1])
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
            .withPassphrase(secrets[1])
            .createOne();

        await expect(multiSignatureFunds).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(multiSignatureFunds.id).toBeForged();

        // Create second signature registration
        const secondSignature = TransactionFactory.secondSignature(support.passphrases.secondPassphrase)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(secondSignature).toBeRejected();
        await support.snoozeForBlock(1);
        await expect(secondSignature.id).not.toBeForged();

        // Create transfer to assert multi sig wallet can still send funds
        const transfer = TransactionFactory.transfer(multiSigAddress, 18 * 1e8)
            .withSenderPublicKey(multiSigPublicKey)
            .withPassphraseList(passphrases)
            .createOne();

        await expect(transfer).toBeAccepted();
        await support.snoozeForBlock(1);
        await expect(transfer.id).toBeForged();
    });
});
