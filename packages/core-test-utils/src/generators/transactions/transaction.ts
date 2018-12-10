import { client, constants, crypto } from "@arkecosystem/crypto";
import superheroes from "superheroes";
import { delegatesSecrets } from "../../fixtures/testnet/passphrases";

const defaultPassphrase = delegatesSecrets[0];
const { TRANSFER, SECOND_SIGNATURE, DELEGATE_REGISTRATION, VOTE } = constants.TRANSACTION_TYPES;

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
    type = type || TRANSFER;
    passphrase = passphrase || defaultPassphrase;

    if (!["mainnet", "devnet", "testnet"].includes(network)) {
        throw new Error("Invalid network");
    }

    if (![TRANSFER, SECOND_SIGNATURE, DELEGATE_REGISTRATION, VOTE].includes(type)) {
        throw new Error("Invalid transaction type");
    }

    let secondPassphrase;
    if (Array.isArray(passphrase)) {
        secondPassphrase = passphrase[1];
        passphrase = passphrase[0];
    }

    client.getConfigManager().setFromPreset("ark", network);

    const transactions = [];
    for (let i = 0; i < quantity; i++) {
        let builder: any = client.getBuilder();
        switch (type) {
            case TRANSFER: {
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
            case SECOND_SIGNATURE: {
                builder = builder.secondSignature().signatureAsset(passphrase);
                break;
            }
            case DELEGATE_REGISTRATION: {
                const username = superheroes
                    .random()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "_")
                    .substring(0, 20);
                builder = builder.delegateRegistration().usernameAsset(username);
                break;
            }
            case VOTE: {
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
