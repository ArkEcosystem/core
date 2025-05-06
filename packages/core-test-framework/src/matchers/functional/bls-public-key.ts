import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            blsPublicKeyRegistered(): Promise<R>;
        }
    }
}

expect.extend({
    blsPublicKeyRegistered: async (transaction: Interfaces.ITransactionData) => {
        let pass = false;

        let errors;
        try {
            const { body } = await got.get(`http://localhost:4003/api/wallets/${transaction.senderPublicKey}`);

            const parsedBody = JSON.parse(body);

            errors = parsedBody.errors;

            const blsPublicKeyAsset = transaction.asset!.blsPublicKey as Interfaces.IBlsPublicKeyAsset;
            pass =
                parsedBody.errors === undefined &&
                parsedBody.data.attributes.blsPublicKey === blsPublicKeyAsset.newBlsPublicKey;
        } catch (e) {
            errors = e;
        }

        return {
            pass,
            message: /* istanbul ignore next */ () =>
                `expected blsPublicKey ${transaction.asset?.blsPublicKey?.newBlsPublicKey} ${
                    // @ts-ignore
                    this.isNot ? "not" : ""
                } to be registered. ${errors}`,
        };
    },
});
