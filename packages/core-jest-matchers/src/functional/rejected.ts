import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeRejected(): Promise<R>;
            toBeEachRejected(): Promise<R>;
        }
    }
}

expect.extend({
    toBeRejected: async (transaction: Interfaces.ITransactionData) => {
        let pass: boolean = true;
        let response: string;
        try {
            const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions: [transaction] }),
            });

            response = body;
            const parsedBody = JSON.parse(body);

            pass = parsedBody.errors !== undefined && parsedBody.data.invalid.includes(transaction.id);
        } catch (e) {} // tslint:disable-line

        return {
            pass,
            message: () => `expected ${transaction.id} ${this.isNot ? "not" : ""} to be rejected, but: ${response}`,
        };
    },
    toBeEachRejected: async (transactions: Interfaces.ITransactionData[]) => {
        let pass: boolean = true;
        let response: string;

        try {
            for (const transaction of transactions) {
                const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                    body: JSON.stringify({ transactions: [transaction] }),
                });

                response = body;
                const parsedBody = JSON.parse(body);

                pass = parsedBody.errors !== undefined && parsedBody.data.invalid.includes(transaction.id);

                if (!pass) {
                    break;
                }
            }
        } catch (e) {} // tslint:disable-line

        return {
            pass,
            message: () => `expected transactions ${this.isNot ? "not" : ""} to be rejected, but: ${response}`,
        };
    },
});
