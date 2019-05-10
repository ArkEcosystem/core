import got from "got";

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
            const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions }),
            });

            const parsedBody = JSON.parse(body);

            pass = parsedBody.errors === undefined && parsedBody.data.invalid.includes(id);
        } catch (e) {} // tslint:disable-line

        return {
            pass,
            message: () => (pass ? `expected ${id} to be rejected` : `expected ${id} not to be rejected`),
        };
    },
});
