import { httpie } from "@arkecosystem/core-utils";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toBeForged(): R;
        }
    }
}

expect.extend({
    toBeForged: async (id: string) => {
        let pass: boolean = false;

        try {
            const { body } = await httpie.get(`http://localhost:4003/api/v2/transactions/${id}`);

            pass = body.data.id === id;
        } catch (error) {
            // do nothing...
        }

        return {
            pass,
            message: () => (pass ? `expected ${id} to be forged` : `expected ${id} not to be forged`),
        };
    },
});
