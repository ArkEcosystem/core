export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toDispatch(dispatcher: object, value: string): R;
        }
    }
}

expect.extend({
    toDispatch(received, dispatcher, expected) {
        const mock = jest.fn();

        dispatcher.dispatch = mock;
        received();

        const calls = dispatcher.dispatch.mock.calls;
        const pass = calls && calls[0] ? Object.is(calls[0][0], expected) : false;

        return {
            // FIXME isNot is necessary to write the right message
            // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
            message: () => `Expected "${expected}" to ${this.isNot ? "not" : ""} be dispatched`,
            pass,
        };
    },
});
