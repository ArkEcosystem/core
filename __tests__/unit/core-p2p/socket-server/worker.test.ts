import { request } from "../mocks/request";
import "../mocks/scworker";

import delay from "delay";
import { Worker } from "../../../../packages/core-p2p/src/socket-server/worker";

const worker = new Worker();

// @ts-ignore
worker.scServer.wsServer = {
    on: () => undefined,
    _server: {
        on: () => undefined,
    },
};
worker.httpServer = {
    on: () => undefined,
} as any;
worker.scServer.setCodecEngine = codec => undefined;

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
            expect(worker.sendToMasterAsync).toHaveBeenLastCalledWith("p2p.utils.getHandlers");

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

        it("should use the local rate limiter", async () => {
            jest.restoreAllMocks();
            // @ts-ignore
            jest.spyOn(worker, "sendToMasterAsync").mockResolvedValue({ data: {} });
            // @ts-ignore
            jest.spyOn(worker, "getRateLimitedEndpoints").mockReturnValue({
                "p2p.peer.postBlock": true,
            });
            request.event = "p2p.peer.postBlock";
            // @ts-ignore
            await worker.handleEmit(request, undefined);
            // @ts-ignore
            expect(worker.sendToMasterAsync).toHaveBeenCalledWith(
                "p2p.internal.getRateLimitStatus",
                expect.any(Object),
            );
        });

        it("should use the shared rate limiter", async () => {
            jest.restoreAllMocks();
            // @ts-ignore
            jest.spyOn(worker, "sendToMasterAsync").mockResolvedValue({ data: {} });
            // @ts-ignore
            jest.spyOn(worker, "getRateLimitedEndpoints").mockReturnValue({
                "p2p.peer.postBlock": true,
            });
            request.event = "p2p.peer.postTransactions";
            // @ts-ignore
            await worker.handleEmit(request, undefined);
            // @ts-ignore
            expect(worker.sendToMasterAsync).not.toHaveBeenCalled();
        });
    });
});
