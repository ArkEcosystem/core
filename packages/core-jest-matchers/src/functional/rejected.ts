import got from "got";

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeRejected(): R;
        }
    }
}

expect.extend({
    toBeRejected: async (transactions, id) => {
        let pass = true;

        try {
            const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions }),
            });

            const parsedBody = JSON.parse(body);

            pass = parsedBody.errors === undefined && parsedBody.data.invalid.includes(id);
        } catch {}

        return {
            pass,
            message: () => `expected ${id} ${this.isNot ? "not" : ""} to be rejected`,
        };
    },
});
