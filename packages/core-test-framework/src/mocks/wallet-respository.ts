import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { Utils } from "@arkecosystem/crypto";

let mockNonce: Utils.BigNumber = Utils.BigNumber.make(1);

export const setNonce = (nonce: Utils.BigNumber) => {
    mockNonce = nonce;
};

class WalletRepositoryMock implements Partial<WalletRepository> {
    getNonce(publicKey: string): Utils.BigNumber {
        return mockNonce;
    }
}

export const instance = new WalletRepositoryMock();
