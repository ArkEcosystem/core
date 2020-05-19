import { CryptoSuite } from "@arkecosystem/core-crypto";
import { WalletRepository as WalletRepoCore } from "@arkecosystem/core-state/src/wallets";
import { Types } from "@arkecosystem/crypto";

export class WalletRepository implements Partial<WalletRepoCore> {
    public mockNonce: number | Types.BigNumber = 1;
    public constructor(private cryptoManager: CryptoSuite.CryptoManager) {}

    public getNonce(publicKey: string): Types.BigNumber {
        return this.cryptoManager.LibraryManager.Libraries.BigNumber.make(this.mockNonce);
    }

    public setNonce(nonce: Types.BigNumber) {
        this.mockNonce = nonce;
    }
}
