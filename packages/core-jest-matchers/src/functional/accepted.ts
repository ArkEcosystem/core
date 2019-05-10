import got from "got";

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
            const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions: [transaction] }),
            });

            const parsedBody = JSON.parse(body);

            pass =
                parsedBody.errors === undefined &&
                parsedBody.data.accept.includes(transaction.id) &&
                parsedBody.data.broadcast.includes(transaction.id);
        } catch (e) {} // tslint:disable-line

        return {
            pass,
            message: () =>
                pass ? `expected ${transaction.id} to be accepted` : `expected ${transaction.id} not to be accepted`,
        };
    },
});
