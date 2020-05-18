import { CryptoSuite } from "@arkecosystem/core-crypto";
import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { Types } from "@arkecosystem/crypto";

let mockNonce: number | Types.BigNumber = 1;

export const setNonce = (nonce: Types.BigNumber) => {
    mockNonce = nonce;
};

export class WalletRepositoryMock implements Partial<WalletRepository> {
    public constructor(private cryptoManager: CryptoSuite.CryptoManager) {}

    public getNonce(publicKey: string): Types.BigNumber {
        return this.cryptoManager.LibraryManager.Libraries.BigNumber.make(mockNonce);
    }
}
