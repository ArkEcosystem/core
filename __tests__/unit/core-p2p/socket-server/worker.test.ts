import "../mocks/scworker";

import delay from "delay";
import { Worker } from "../../../../packages/core-p2p/src/socket-server/worker";

const worker = new Worker();

describe("Worker", () => {
    describe("run", () => {
        it("should init the worker", async () => {
            // @ts-ignore
            jest.spyOn(worker, "sendToMasterAsync").mockResolvedValue({
                data: { whitelist: [], remoteAccess: [], rateLimit: 1 },
            });

            await worker.run();
            await delay(500);

            // @ts-ignore
            expect(worker.sendToMasterAsync).toHaveBeenLastCalledWith("p2p.utils.getConfig");

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
