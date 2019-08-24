import got from "got";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeForged(): Promise<R>;
        }
    }
}

expect.extend({
    toBeForged: async (id: string) => {
        let pass = false;

        try {
            const { body } = await got.get(`http://localhost:4003/api/v2/transactions/${id}`);

            const parsedBody = JSON.parse(body);

            pass = parsedBody.data.id === id;
        } catch (e) {} // tslint:disable-line

        return {
            pass,
            message: () => `expected ${id} ${this.isNot ? "not" : ""} to be forged`,
        };
    },
});
