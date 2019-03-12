import "../../../../packages/core-jest-matchers/src/blockchain/dispatch";

describe(".toDispatch", () => {
    const blockchain = {
        dispatch(event) {
            return event;
        },
    };

    test("passes when the dispatch method is called with the argument", () => {
        expect(() => blockchain.dispatch("EVENT")).toDispatch(blockchain, "EVENT");
    });

    test("fails when the dispatch method is not called with the argument", async () => {
        // tslint:disable-next-line:no-empty
        await expect(() => {}).not.toDispatch(blockchain, "FAKE-EVENT");
        await expect(() => blockchain.dispatch("OTHER-EVENT")).not.toDispatch(blockchain, "EVENT");
    });
});
