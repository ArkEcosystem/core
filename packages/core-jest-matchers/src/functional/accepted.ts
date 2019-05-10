import { httpie } from "@arkecosystem/core-utils";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeAccepted(): R;
        }
    }
}

expect.extend({
    toBeAccepted: async transaction => {
        let pass: boolean = false;

        try {
            const { body } = await httpie.post(`http://localhost:4003/api/v2/transactions`, {
                body: { transactions: [transaction] },
            });

            pass =
                body.errors === undefined &&
                body.data.accept.includes(transaction.id) &&
                body.data.broadcast.includes(transaction.id);
        } catch (error) {
            // do nothing
        }

        return {
            pass,
            message: () =>
                pass ? `expected ${transaction.id} to be accepted` : `expected ${transaction.id} not to be accepted`,
        };
    },
});
