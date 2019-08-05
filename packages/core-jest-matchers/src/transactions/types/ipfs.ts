import { Enums } from "@arkecosystem/crypto";

const { Ipfs } = Enums.TransactionType;

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
            pass: received.type === Ipfs,
        };
    },
});
