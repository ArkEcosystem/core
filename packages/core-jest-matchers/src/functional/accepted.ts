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
        let error: string;

        try {
            const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions: [transaction] }),
            });

            const parsedBody = JSON.parse(body);

            pass =
                parsedBody.errors === undefined &&
                parsedBody.data.accept.includes(transaction.id) &&
                parsedBody.data.broadcast.includes(transaction.id);
        } catch (e) {
            error = e.message;
        }

        return {
            pass,
            message: () =>
                `expected ${transaction.id} ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
});
