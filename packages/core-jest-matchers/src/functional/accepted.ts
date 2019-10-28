import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeAccepted(): Promise<R>;
            toBeAllAccepted(): Promise<R>;
            toBeEachAccepted(): Promise<R>;
        }
    }
}

expect.extend({
    toBeAccepted: async (transaction: Interfaces.ITransactionData) => {
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

            error = JSON.stringify(parsedBody.errors);
        } catch (e) {
            error = e.message;
            console.error(error);
        }

        return {
            pass,
            message: () =>
                `expected ${transaction.id} ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
    toBeAllAccepted: async (transactions: Interfaces.ITransactionData[]) => {
        let pass: boolean = false;
        let error: string;

        try {
            const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                body: JSON.stringify({ transactions }),
            });

            const parsedBody = JSON.parse(body);
            pass = parsedBody.errors === undefined;

            error = JSON.stringify(parsedBody.errors);
        } catch (e) {
            error = e.message;
            console.error(error);
        }

        return {
            pass,
            message: () =>
                `expected all transactions ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
    toBeEachAccepted: async transactions => {
        let pass: boolean = true;
        let error: string;

        try {
            for (const tx of transactions) {
                const { body } = await got.post(`http://localhost:4003/api/v2/transactions`, {
                    body: JSON.stringify({ transactions: [tx] }),
                });

                const parsedBody = JSON.parse(body);
                if (parsedBody.errors) {
                    error += JSON.stringify(parsedBody.errors);
                    pass = false;
                }
            }
        } catch (e) {
            pass = false;
            error = e.message;
            console.error(error);
        }

        return {
            pass,
            message: () =>
                `expected transactions ${this.isNot ? "not" : ""} to be accepted ${
                    error ? "(error: " + error + ")" : ""
                }`,
        };
    },
});
