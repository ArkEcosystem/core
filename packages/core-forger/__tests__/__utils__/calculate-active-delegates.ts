import { Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { Identities } from "@packages/crypto";

export const calculateActiveDelegates = () => {
    const activeDelegates = [];
    for (let i = 0; i < 51; i++) {
        const address = `Delegate-Wallet-${i}`;
        const wallet = new Wallet(
            address,
            new Services.Attributes.AttributeMap(new Services.Attributes.AttributeSet()),
        );

        wallet.setPublicKey(Identities.PublicKey.fromPassphrase(address));
        // @ts-ignore
        wallet.delegate = { username: `Username: ${address}` };
        // @ts-ignore
        activeDelegates.push(wallet);
    }
    return activeDelegates;
};
