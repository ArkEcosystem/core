import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeUnconfirmed(): Promise<R>;
        }
    }
}

expect.extend({
    toBeUnconfirmed: async (transaction: Interfaces.ITransactionData) => {
        let pass: boolean = false;
        let error: string;

        try {
            const { body } = await got.get(`http://localhost:4003/api/v2/transactions/unconfirmed`);

            const parsedBody = JSON.parse(body);

            pass = !!(parsedBody.data as any[]).find(tx => tx.id === transaction.id);

            error = JSON.stringify(parsedBody.errors);
        } catch (e) {
            error = e.message;
            console.error(error);
        }

        return {
            pass,
            message: () =>
                `expected ${transaction.id} ${this.isNot ? "not" : ""} to be unconfirmed (in the pool) ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
});
