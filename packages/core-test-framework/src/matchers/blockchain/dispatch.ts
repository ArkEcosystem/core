export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        interface Matchers<R> {
            toDispatch(dispatcher: object, value: string): R;
        }
    }
}

expect.extend({
    async toDispatch(received, dispatcher, expected) {
        const mock = jest.fn();

        dispatcher.dispatch = mock;
        await received();

        const calls = dispatcher.dispatch.mock.calls;
        const pass = calls && calls[0] ? Object.is(calls[0][0], expected) : false;

        // @ts-ignore
        /* istanbul ignore next */
        const messageStr = `Expected "${expected}" to ${this.isNot ? "not" : ""} be dispatched, received ${
            calls && calls[0] ? calls[0][0] : ""
        }`;
        /* istanbul ignore next */
        const message = () => messageStr;

        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message,
            pass,
        };
    },
});
