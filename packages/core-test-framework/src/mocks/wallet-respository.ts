import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { Utils } from "@arkecosystem/crypto";

let mockNonce: Utils.BigNumber = Utils.BigNumber.make(1);

export const setMockNonce = (nonce: Utils.BigNumber) => {
    mockNonce = nonce;
};

export const instance: Partial<WalletRepository> = {
    getNonce: (publicKey: string): Utils.BigNumber => {
        return mockNonce;
    },
};
