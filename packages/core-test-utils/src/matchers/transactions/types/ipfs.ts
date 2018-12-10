import { constants } from "@arkecosystem/crypto";

const { IPFS } = constants.TRANSACTION_TYPES;

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeIpfsType(): R;
        }
    }
}

expect.extend({
    toBeIpfsType: received => {
        return {
            message: () => "Expected value to be a valid IPFS transaction.",
            pass: received.type === IPFS,
        };
    },
});
