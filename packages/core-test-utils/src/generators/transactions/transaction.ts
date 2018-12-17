import { client, constants, crypto } from "@arkecosystem/crypto";
import superheroes from "superheroes";
import { delegatesSecrets } from "../../fixtures/testnet/passphrases";

const defaultPassphrase = delegatesSecrets[0];
const { Transfer, SecondSignature, DelegateRegistration, Vote } = constants.TransactionTypes;

export const generateTransaction = (
    network,
    type,
    passphrase,
    addressOrPublicKey,
    amount: number = 2,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) => {
    network = network || "testnet";
    type = type || Transfer;
    passphrase = passphrase || defaultPassphrase;

    if (!["mainnet", "devnet", "testnet"].includes(network)) {
        throw new Error("Invalid network");
    }

    if (![Transfer, SecondSignature, DelegateRegistration, Vote].includes(type)) {
        throw new Error("Invalid transaction type");
    }

    let secondPassphrase;
    if (Array.isArray(passphrase)) {
        secondPassphrase = passphrase[1];
        passphrase = passphrase[0];
    }

    client.getConfigManager().setFromPreset(network);

    const transactions = [];
    for (let i = 0; i < quantity; i++) {
        let builder: any = client.getBuilder();
        switch (type) {
            case Transfer: {
                if (!addressOrPublicKey) {
                    addressOrPublicKey = crypto.getAddress(crypto.getKeys(passphrase).publicKey);
                }
                builder = builder
                    .transfer()
                    .recipientId(addressOrPublicKey)
                    .amount(amount)
                    .vendorField(`Test Transaction ${i + 1}`);
                break;
            }
            case SecondSignature: {
                builder = builder.secondSignature().signatureAsset(passphrase);
                break;
            }
            case DelegateRegistration: {
                const username = superheroes
                    .random()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "_")
                    .substring(0, 20);
                builder = builder.delegateRegistration().usernameAsset(username);
                break;
            }
            case Vote: {
                if (!addressOrPublicKey) {
                    addressOrPublicKey = crypto.getKeys(passphrase).publicKey;
                }
                builder = builder.vote().votesAsset([`+${addressOrPublicKey}`]);
                break;
            }
            default: {
                throw new Error("Invalid transaction type");
            }
        }

        if (fee) {
            builder = builder.fee(fee);
        }

        builder = builder.sign(passphrase);

        if (secondPassphrase) {
            builder = builder.secondSign(secondPassphrase);
        }
        const tx = getStruct ? builder.getStruct() : builder.build();

        transactions.push(tx);
    }

    return transactions;
};
