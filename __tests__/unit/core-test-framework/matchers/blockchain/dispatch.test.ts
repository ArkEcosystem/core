import "@packages/core-test-framework/src/matchers/blockchain/dispatch";

class Dispatcher {
    public dispatch(event: string): void {}

    public async transitionMethod(): Promise<void> {
        this.dispatch("TEST");
    }
}

describe("Dispatch", () => {
    describe("toDispatch", () => {
        it("should be successful on valid event", async () => {
            const dispatcher = new Dispatcher();

            await expect(() => dispatcher.transitionMethod()).toDispatch(dispatcher, "TEST");
        });

        it("should not be successful on invalid event", async () => {
            const dispatcher = new Dispatcher();

            await expect(() => dispatcher.transitionMethod()).not.toDispatch(dispatcher, "INVALID");
        });

        it("should not be successful if event is not dispatched", async () => {
            const dispatcher = new Dispatcher();

            dispatcher.transitionMethod = jest.fn();

            await expect(() => dispatcher.transitionMethod()).not.toDispatch(dispatcher, "TEST");
        });
    });
});
