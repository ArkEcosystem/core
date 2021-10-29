import "jest-extended";

import { ProcessAction } from "@packages/core-kernel/src/contracts/kernel";
import { Pm2ProcessActionsService } from "@packages/core-kernel/src/services/process-actions/drivers/pm2";
import pmx from "@pm2/io";

let pm2: Pm2ProcessActionsService;

class DummyProcessAction implements ProcessAction {
    public name = "dummy";

    public async handler() {
        return "dummy_response";
    }
}

let dummyProcessAction: DummyProcessAction;

beforeEach(() => {
    pm2 = new Pm2ProcessActionsService();

    dummyProcessAction = new DummyProcessAction();
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

describe("Pm2ProcessActionsService", () => {
    it("should register action", async () => {
        pm2.register(dummyProcessAction);
    });

    it("should run action and return response", async () => {
        pm2.register(dummyProcessAction);

        const reply = jest.fn();

        // @ts-ignore
        await pmx.runAction(reply);

        expect(reply).toHaveBeenCalledWith({ response: "dummy_response" });
    });

    it("should run action and return error", async () => {
        dummyProcessAction.handler = jest.fn().mockImplementation(async () => {
            throw new Error();
        });

        pm2.register(dummyProcessAction);

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
