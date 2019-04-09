import { client, crypto } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

export const generateWallets = (network, quantity = 10) => {
    network = network || "testnet";
    if (!["testnet", "mainnet", "devnet", "unitnet"].includes(network)) {
        throw new Error("Invalid network");
    }

    client.getConfigManager().setFromPreset(network);

    const wallets = [];
    for (let i = 0; i < quantity; i++) {
        const passphrase = generateMnemonic();
        const publicKey = crypto.getKeys(passphrase).publicKey;
        const address = crypto.getAddress(publicKey);

        wallets.push({ address, passphrase, publicKey });
    }

    return wallets;
};
