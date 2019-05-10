import { httpie } from "@arkecosystem/core-utils";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeRejected(): R;
        }
    }
}

expect.extend({
    toBeRejected: async (transactions, id) => {
        let pass: boolean = true;

        try {
            const { body } = await httpie.post(`http://localhost:4003/api/v2/transactions`, {
                body: { transactions },
            });

            pass = body.errors === undefined && body.data.invalid.includes(id);
        } catch (error) {
            // do nothing
        }

        return {
            pass,
            message: () => (pass ? `expected ${id} to be rejected` : `expected ${id} not to be rejected`),
        };
    },
});
