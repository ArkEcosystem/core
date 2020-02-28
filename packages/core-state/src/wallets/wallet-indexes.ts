import { Contracts } from "@arkecosystem/core-kernel";

export const addressesIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
    if (wallet.address) {
        index.set(wallet.address, wallet);
    }
};

export const publicKeysIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
    if (wallet.publicKey) {
        index.set(wallet.publicKey, wallet);
    }
};

export const usernamesIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
    if (wallet.isDelegate()) {
        index.set(wallet.getAttribute("delegate.username"), wallet);
    }
};

export const resignationsIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
    if (wallet.isDelegate() && wallet.hasAttribute("delegate.resigned")) {
        index.set(wallet.getAttribute("delegate.username"), wallet);
    }
};

export const locksIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
    if (wallet.hasAttribute("htlc.locks")) {
        const locks: object = wallet.getAttribute("htlc.locks");

        for (const lockId of Object.keys(locks)) {
            index.set(lockId, wallet);
        }
    }
};

export const ipfsIndexer = (index: Contracts.State.WalletIndex, wallet: Contracts.State.Wallet) => {
    if (wallet.hasAttribute("ipfs.hashes")) {
        const hashes: object = wallet.getAttribute("ipfs.hashes");

        for (const hash of Object.keys(hashes)) {
            index.set(hash, wallet);
        }
    }
};
