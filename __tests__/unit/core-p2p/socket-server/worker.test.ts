import "../mocks/scworker";

import delay from "delay";
import { Worker } from "../../../../packages/core-p2p/src/socket-server/worker";

let worker;

beforeAll(() => {
    worker = new Worker();
});

describe("Worker", () => {
    describe("run", () => {
        it("should init the worker", async () => {
            worker.run();
            await delay(500);

            // initRateLimit calls sendToMaster
            expect(worker.sendToMaster).toHaveBeenCalledWith(
                {
                    endpoint: "p2p.init.getConfig",
                },
                expect.any(Function),
            );

            // registering endpoint on connection
            expect(worker.scServer.on).toHaveBeenCalledWith("connection", expect.any(Function));

            // registering middlewares
            expect(worker.scServer.addMiddleware).toHaveBeenCalledWith(
                worker.scServer.MIDDLEWARE_HANDSHAKE_WS,
                expect.any(Function),
            );

            expect(worker.scServer.addMiddleware).toHaveBeenCalledWith(
                worker.scServer.MIDDLEWARE_EMIT,
                expect.any(Function),
            );
        });
    });
});
