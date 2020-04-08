import "@packages/core-test-framework/src/matchers/blockchain/dispatch";

class Dispatcher {
    dispatch(event: string): void {}

    async transitionMethod(): Promise<void> {
        this.dispatch("TEST");
    }
}

describe("Dispatch", () => {
    describe("toDispatch", () => {
        it("should be successful on valid event", async () => {
            let dispatcher = new Dispatcher();

            await expect(() => dispatcher.transitionMethod()).toDispatch(dispatcher, "TEST");
        });

        it("should not be successful on invalid event", async () => {
            let dispatcher = new Dispatcher();

            await expect(() => dispatcher.transitionMethod()).not.toDispatch(dispatcher, "INVALID");
        });
    });
});
