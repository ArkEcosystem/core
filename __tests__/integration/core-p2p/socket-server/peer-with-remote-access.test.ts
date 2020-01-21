import "jest-extended";

import "../mocks/core-container";
import { defaults } from "../mocks/p2p-options";

import { Managers } from "@arkecosystem/crypto/src";
import delay from "delay";
import SocketCluster from "socketcluster";
import socketCluster from "socketcluster-client";
import { startSocketServer } from "../../../../packages/core-p2p/src/socket-server";
import { createPeerService } from "../../../helpers/peers";

Managers.configManager.setFromPreset("unitnet");

let server: SocketCluster;
let socket;
let emit;

const headers = {
    version: "2.1.0",
    port: 4009,
    height: 1,
    "Content-Type": "application/json",
};

beforeAll(async () => {
    process.env.CORE_ENV = "test";
    defaults.remoteAccess = ["127.0.0.1", "::ffff:127.0.0.1"];

    const { service, processor } = createPeerService();

    server = await startSocketServer(service, { server: { port: 4007 } });
    await delay(1000);

    socket = socketCluster.create({
        port: 4007,
        hostname: "127.0.0.1",
    });

    emit = (event, data) =>
        new Promise((resolve, reject) => {
            socket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });

    jest.spyOn(processor, "validateAndAcceptPeer").mockImplementation(jest.fn());
});

afterAll(() => {
    socket.destroy();
    server.destroy();
});

describe("Peer socket endpoint", () => {
    describe("Socket errors", () => {
        it("should not be disconnected and banned if is configured in remoteAccess", async () => {
            for (let i = 0; i < 300; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                    data: {},
                });
                expect(data.state.height).toBeNumber();
            }

            expect(socket.getState()).toBe("open");
        });
    });
});
