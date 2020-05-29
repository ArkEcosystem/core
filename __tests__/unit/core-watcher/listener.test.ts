import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { Listener } from "@packages/core-watcher/src/listener";

let sandbox: Sandbox;
let listener: Listener;
const mockDatabase = {
    addEvent: jest.fn(),
};

let handler;

const mockEventDispatcher = {
    listen: jest.fn().mockImplementation((event, cb) => {
        handler = cb;
    }),
};

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.WatcherDatabaseService).toConstantValue(mockDatabase);
    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(mockEventDispatcher);
    sandbox.app.bind(Container.Identifiers.WatcherEventListener).to(Listener).inSingletonScope();

    listener = sandbox.app.get(Container.Identifiers.WatcherEventListener);
});

afterEach(() => {});

describe("Listener", () => {
    describe("Boot", () => {
        it("should boot and save event on emit", async () => {
            listener.boot();

            handler.handle({ name: "dummy_event", data: "dummy_data" });

            expect(mockDatabase.addEvent).toHaveBeenCalledTimes(1);
        });
    });
});
