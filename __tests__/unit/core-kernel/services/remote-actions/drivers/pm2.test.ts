import "jest-extended";

import { RemoteAction } from "@arkecosystem/core-kernel/dist/contracts/kernel";
import { Pm2RemoteActionsService } from "@packages/core-kernel/src/services/remote-actions/drivers/pm2";
import pmx from "@pm2/io";

let pm2: Pm2RemoteActionsService;

class DummyRemoteAction implements RemoteAction {
    public name = "dummy";

    public async handler() {
        return "dummy_response";
    }
}

let dummyRemoteAction: DummyRemoteAction;

beforeEach(() => {
    pm2 = new Pm2RemoteActionsService();

    dummyRemoteAction = new DummyRemoteAction();
});

jest.mock("@pm2/io", () => {
    class MockPmx {
        private cb?: Function;

        public action(name: string, cb: Function) {
            this.cb = cb;
        }

        public async runAction(reply: any) {
            await this.cb!(reply);
        }
    }

    return new MockPmx();
});

describe("Pm2RemoteActionsService", () => {
    it("should register action", async () => {
        pm2.register(dummyRemoteAction);
    });

    it("should run action and return response", async () => {
        pm2.register(dummyRemoteAction);

        const reply = jest.fn();

        // @ts-ignore
        await pmx.runAction(reply);

        expect(reply).toHaveBeenCalledWith({ response: "dummy_response" });
    });

    it("should run action and return error", async () => {
        dummyRemoteAction.handler = jest.fn().mockImplementation(async () => {
            throw new Error();
        });

        pm2.register(dummyRemoteAction);

        const reply = jest.fn();

        // @ts-ignore
        await pmx.runAction(reply);

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.toBeString(),
            }),
        );
    });
});
