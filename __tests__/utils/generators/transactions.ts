import { client, constants, crypto } from "@arkecosystem/crypto";
import superheroes from "superheroes";
import { delegatesSecrets } from "../fixtures/testnet/passphrases";

const defaultPassphrase = delegatesSecrets[0];
const { Transfer, SecondSignature, DelegateRegistration, Vote } = constants.TransactionTypes;

export function generateTransaction(
    network,
    type,
    passphrase,
    addressOrPublicKeyOrUsername,
    amount: number = 2,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) {
    network = network || "testnet";
    type = type || Transfer;
    passphrase = passphrase || defaultPassphrase;

    if (!["mainnet", "devnet", "testnet", "unitnet"].includes(network)) {
        throw new Error("Invalid network");
    }

    if (![Transfer, SecondSignature, DelegateRegistration, Vote].includes(type)) {
        throw new Error("Invalid transaction type");
    }

    let secondPassphrase;
    if (typeof passphrase === "object") {
        secondPassphrase = passphrase.secondPassphrase;
        passphrase = passphrase.passphrase;
    }

    client.getConfigManager().setFromPreset(network);

    const transactions = [];
    for (let i = 0; i < quantity; i++) {
        let builder: any = client.getBuilder();
        switch (type) {
            case Transfer: {
                if (!addressOrPublicKeyOrUsername) {
                    addressOrPublicKeyOrUsername = crypto.getAddress(crypto.getKeys(passphrase).publicKey);
                }
                builder = builder
                    .transfer()
                    .recipientId(addressOrPublicKeyOrUsername)
                    .amount(amount)
                    .vendorField(`Test Transaction ${i + 1}`);
                break;
            }
            case SecondSignature: {
                builder = builder.secondSignature().signatureAsset(passphrase);
                break;
            }
            case DelegateRegistration: {
                const username =
                    addressOrPublicKeyOrUsername ||
                    superheroes
                        .random()
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "_")
                        .substring(0, 20);
                builder = builder.delegateRegistration().usernameAsset(username);
                break;
            }
            case Vote: {
                if (!addressOrPublicKeyOrUsername) {
                    addressOrPublicKeyOrUsername = crypto.getKeys(passphrase).publicKey;
                }
                builder = builder.vote().votesAsset([`+${addressOrPublicKeyOrUsername}`]);
                break;
            }
            default: {
                throw new Error("Invalid transaction type");
            }
        }

        if (fee || fee === 0) {
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
}

export function generateTransfer(
    network: string,
    passphrase: any = "secret passphrase",
    address?: string,
    amount: number = 2,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) {
    if (Array.isArray(passphrase)) {
        return passphrase.map(p => generateTransaction(network, Transfer, p, address, amount, 1, getStruct, fee)[0]);
    }

    return generateTransaction(network, Transfer, passphrase, address, amount, quantity, getStruct, fee);
}

export function generateSecondSignature(
    network,
    passphrase,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) {
    if (Array.isArray(passphrase)) {
        return passphrase.map(
            p => generateTransaction(network, SecondSignature, p, undefined, undefined, 1, getStruct, fee)[0],
        );
    }

    return generateTransaction(network, SecondSignature, passphrase, undefined, undefined, quantity, getStruct, fee);
}

export function generateDelegateRegistration(
    network,
    passphrase,
    quantity: number = 1,
    getStruct: boolean = false,
    username?: string,
    fee?: number,
) {
    if (Array.isArray(passphrase)) {
        return passphrase.map(
            p => generateTransaction(network, DelegateRegistration, p, username, undefined, 1, getStruct, fee)[0],
        );
    }

    return generateTransaction(
        network,
        DelegateRegistration,
        passphrase,
        username,
        undefined,
        quantity,
        getStruct,
        fee,
    );
}

export function generateVote(
    network,
    passphrase,
    publicKey,
    quantity: number = 10,
    getStruct: boolean = false,
    fee?: number,
) {
    if (Array.isArray(passphrase)) {
        return passphrase.map(p => generateTransaction(network, Vote, p, publicKey, undefined, 1, getStruct, fee)[0]);
    }

    return generateTransaction(network, Vote, passphrase, publicKey, undefined, quantity, getStruct, fee);
}
