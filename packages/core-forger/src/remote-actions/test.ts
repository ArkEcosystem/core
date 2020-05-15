import { Contracts } from "@arkecosystem/core-kernel";

export class TestRemoteAction implements Contracts.Kernel.RemoteAction {
    public name = "test";

    public async handler() {
        console.log("TRIGGERED");

        throw new Error("Test ERR");

        return {
            response: "test",
        };
    }
}
