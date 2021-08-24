import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toBeAccepted(): Promise<R>;
            toBeAllAccepted(): Promise<R>;
            toBeEachAccepted(): Promise<R>;
        }
    }
}

expect.extend({
    toBeAccepted: async (transaction: Interfaces.ITransactionData) => {
        const { body } = await got.post(`http://localhost:4003/api/transactions`, {
            body: JSON.stringify({ transactions: [transaction] }),
        });

        const parsedBody = JSON.parse(body);

        const pass =
            parsedBody.errors === undefined &&
            parsedBody.data.accept.includes(transaction.id) &&
            parsedBody.data.broadcast.includes(transaction.id);

        const error = JSON.stringify(parsedBody.errors);

        return {
            pass,
            message: /* istanbul ignore next */ () =>
                // @ts-ignore
                `expected ${transaction.id} ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
    toBeAllAccepted: async (transactions: Interfaces.ITransactionData[]) => {
        const { body } = await got.post(`http://localhost:4003/api/transactions`, {
            body: JSON.stringify({ transactions }),
        });

        const parsedBody = JSON.parse(body);
        const pass = parsedBody.errors === undefined;

        const error = JSON.stringify(parsedBody.errors);

        return {
            pass,
            message: /* istanbul ignore next */ () =>
                // @ts-ignore
                `expected all transactions ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
    toBeEachAccepted: async (transactions) => {
        let pass = true;
        let error: string | undefined;

        for (const tx of transactions) {
            const { body } = await got.post(`http://localhost:4003/api/transactions`, {
                body: JSON.stringify({ transactions: [tx] }),
            });

            const parsedBody = JSON.parse(body);
            if (parsedBody.errors) {
                error += JSON.stringify(parsedBody.errors);
                pass = false;
            }
        }

        return {
            pass,
            message: /* istanbul ignore next */ () =>
                // @ts-ignore
                `expected transactions ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
});
