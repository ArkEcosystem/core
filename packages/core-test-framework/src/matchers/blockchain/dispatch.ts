export {};

declare global {
    namespace jest {
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

        const messageStr = `Expected "${expected}" to ${this.isNot ? "not" : ""} be dispatched, received ${
            calls && calls[0] ? calls[0][0] : ""
        }`;
        const message = () => messageStr;

        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message,
            pass,
        };
    },
});
