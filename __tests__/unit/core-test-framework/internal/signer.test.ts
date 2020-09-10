import "jest-extended";

import { Generators } from "@packages/core-test-framework/src";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Signer } from "@packages/core-test-framework/src/internal/signer";
import { Identities, Interfaces } from "@packages/crypto";
import { HtlcLockExpirationType } from "@packages/crypto/src/enums";

let signer: Signer;
const config = Generators.generateCryptoConfigRaw();

beforeEach(() => {
    signer = new Signer(config, "0");
});

describe("Signer", () => {
    it("should make transfer", async () => {
        const options = {
            transferFee: "5",
            recipient: Identities.Address.fromPassphrase(passphrases[2]),
            amount: "100",
            passphrase: passphrases[0],
            vendorField: "dummy",
        };

        const entity: Interfaces.ITransactionData = signer.makeTransfer(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.vendorField).toBeDefined();
    });

    it("should make transfer with second signature", async () => {
        const options = {
            transferFee: "5",
            recipient: Identities.Address.fromPassphrase(passphrases[2]),
            amount: "100",
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
            vendorField: "dummy",
        };

        const entity: Interfaces.ITransactionData = signer.makeTransfer(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.vendorField).toBeDefined();
    });

    it("should make delegate", async () => {
        const options = {
            delegateFee: "5",
            username: "dummy",
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeDelegate(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.delegate?.username).toBeString();
    });

    it("should make delegate with second signature", async () => {
        const options = {
            delegateFee: "5",
            username: "dummy",
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeDelegate(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.delegate?.username).toBeString();
    });

    it("should make second signature", async () => {
        const options = {
            signatureFee: "5",
            username: "dummy",
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeSecondSignature(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.signature?.publicKey).toBeString();
    });

    it("should make vote", async () => {
        const options = {
            voteFee: "5",
            delegate: Identities.PublicKey.fromPassphrase(passphrases[3]),
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeVote(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.votes).toBeArray();
    });

    it("should make vote with second signature", async () => {
        const options = {
            voteFee: "5",
            delegate: Identities.PublicKey.fromPassphrase(passphrases[3]),
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeVote(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.votes).toBeArray();
    });

    it("should make multi signature registration", async () => {
        const options = {
            min: 2,
            participants: `${Identities.PublicKey.fromPassphrase(passphrases[0])},${Identities.PublicKey.fromPassphrase(
                passphrases[1],
            )},${Identities.PublicKey.fromPassphrase(passphrases[2])}`,
            passphrases: `${passphrases[0]},${passphrases[1]},${passphrases[2]}`,
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeMultiSignatureRegistration(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.signatures).toBeArray();
        expect(entity.asset?.multiSignature?.min).toBeNumber();
        expect(entity.asset?.multiSignature?.publicKeys).toBeArray();
    });

    it("should make multi signature registration with second signature", async () => {
        const options = {
            min: 2,
            participants: `${Identities.PublicKey.fromPassphrase(passphrases[0])},${Identities.PublicKey.fromPassphrase(
                passphrases[1],
            )},${Identities.PublicKey.fromPassphrase(passphrases[2])}`,
            passphrases: `${passphrases[0]},${passphrases[1]},${passphrases[2]}`,
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeMultiSignatureRegistration(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.signatures).toBeArray();
        expect(entity.asset?.multiSignature?.min).toBeNumber();
        expect(entity.asset?.multiSignature?.publicKeys).toBeArray();
    });

    it("should make ipfs", async () => {
        const options = {
            ipfsFee: "5",
            ipfs: "dummy",
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeIpfs(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.ipfs).toBeString();
    });

    it("should make ipfs with second signature", async () => {
        const options = {
            ipfsFee: "5",
            ipfs: "dummy",
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeIpfs(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.ipfs).toBeString();
    });

    it("should make multi payment", async () => {
        const options = {
            multipaymentFee: "5",
            payments: [
                {
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]),
                    amount: "2",
                },
                {
                    recipientId: Identities.Address.fromPassphrase(passphrases[1]),
                    amount: "3",
                },
            ],
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeMultipayment(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.payments).toBeArray();
    });

    it("should make multi payment with second signature", async () => {
        const options = {
            multipaymentFee: "5",
            payments: [
                {
                    recipientId: Identities.Address.fromPassphrase(passphrases[0]),
                    amount: "2",
                },
                {
                    recipientId: Identities.Address.fromPassphrase(passphrases[1]),
                    amount: "3",
                },
            ],
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeMultipayment(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.payments).toBeArray();
    });

    it("should make htlc lock", async () => {
        const options = {
            htlcLockFee: "5",
            lock: {
                secretHash: "dummy hash",
                expiration: {
                    type: HtlcLockExpirationType.EpochTimestamp,
                    value: 5,
                },
            },
            amount: "100",
            recipient: Identities.Address.fromPassphrase(passphrases[0]),
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeHtlcLock(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.lock?.secretHash).toBeString();
        expect(entity.asset?.lock?.expiration).toBeDefined();
    });

    it("should make htlc lock with second signature", async () => {
        const options = {
            htlcLockFee: "5",
            lock: {
                secretHash: "dummy hash",
                expiration: {
                    type: HtlcLockExpirationType.EpochTimestamp,
                    value: 5,
                },
            },
            amount: "100",
            recipient: Identities.Address.fromPassphrase(passphrases[0]),
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeHtlcLock(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.lock?.secretHash).toBeString();
        expect(entity.asset?.lock?.expiration).toBeDefined();
    });

    it("should make htlc claim", async () => {
        const options = {
            htlcClaimFee: "5",
            claim: {
                lockTransactionId: "12345",
                unlockSecret: "dummy unlock secret",
            },
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeHtlcClaim(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.claim?.lockTransactionId).toBeString();
        expect(entity.asset?.claim?.unlockSecret).toBeString();
    });

    it("should make htlc claim with second signature", async () => {
        const options = {
            htlcClaimFee: "5",
            claim: {
                lockTransactionId: "12345",
                unlockSecret: "dummy unlock secret",
            },
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeHtlcClaim(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.claim?.lockTransactionId).toBeString();
        expect(entity.asset?.claim?.unlockSecret).toBeString();
    });

    it("should make htlc refound", async () => {
        const options = {
            htlcRefundFee: "5",
            refund: {
                lockTransactionId: "12345",
            },
            passphrase: passphrases[0],
        };

        const entity: Interfaces.ITransactionData = signer.makeHtlcRefund(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeUndefined();
        expect(entity.asset?.refund?.lockTransactionId).toBeString();
    });

    it("should make htlc refound with second signature", async () => {
        const options = {
            htlcRefundFee: "5",
            refund: {
                lockTransactionId: "12345",
            },
            passphrase: passphrases[0],
            secondPassphrase: passphrases[1],
        };

        const entity: Interfaces.ITransactionData = signer.makeHtlcRefund(options);

        expect(entity.signature).toBeDefined();
        expect(entity.secondSignature).toBeDefined();
        expect(entity.asset?.refund?.lockTransactionId).toBeString();
    });
});
