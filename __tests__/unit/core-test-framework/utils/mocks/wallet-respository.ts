import { WalletRepository } from "@packages/core-state/src/wallets";
import { Utils } from "@packages/crypto";

let mockNonce: Utils.BigNumber = Utils.BigNumber.make(1);

export const setMockNonce = (nonce: Utils.BigNumber) => {
    mockNonce = nonce;
};

export const walletRepository: Partial<WalletRepository> = {
    getNonce: (publicKey: string): Utils.BigNumber => {
        return mockNonce;
    },
};
