import { Enums } from "@arkecosystem/crypto";

const { Ipfs } = Enums.TransactionType;

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeIpfsType(): R;
        }
    }
}

expect.extend({
    toBeIpfsType: (received) => {
        return {
            message: /* istanbul ignore next */ () => "Expected value to be a valid IPFS transaction.",
            pass: received.type === Ipfs,
        };
    },
});
