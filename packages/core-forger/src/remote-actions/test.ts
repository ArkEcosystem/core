import { Contracts } from "@arkecosystem/core-kernel";

export class TestRemoteAction implements Contracts.Kernel.RemoteAction {
    public name = "test";

    public async handler() {
        return {
            response: "test",
        };
    }
}
