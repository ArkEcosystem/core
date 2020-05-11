import { CryptoManager } from "@arkecosystem/core-crypto";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBePublicKey(): R;
        }
    }
}

expect.extend({
    toBePublicKey: (received, cryptoManager = CryptoManager.createFromPreset("testnet")) => {
        let pass: boolean;

        try {
            pass = cryptoManager.Identities.Address.fromPublicKey(received).length === 34;
        } catch (e) {
            pass = false;
        }

        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid public key",
            pass,
        };
    },
});
