import { CryptoSuite } from "@packages/core-crypto";
import { Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";

export const calculateActiveDelegates = (cryptoManager: CryptoSuite.CryptoManager) => {
    const activeDelegates = [];
    for (let i = 0; i < 51; i++) {
        const address = `Delegate-Wallet-${i}`;
        const wallet = new Wallet(
            cryptoManager,
            address,
            new Services.Attributes.AttributeMap(new Services.Attributes.AttributeSet()),
        );

        wallet.publicKey = cryptoManager.Identities.PublicKey.fromPassphrase(address);
        // @ts-ignore
        wallet.delegate = { username: `Username: ${address}` };
        // @ts-ignore
        activeDelegates.push(wallet);
    }
    return activeDelegates;
};
