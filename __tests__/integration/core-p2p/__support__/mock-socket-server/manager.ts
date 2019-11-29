import { fork } from "child_process";
import delay from "delay";
import socketCluster from "socketcluster-client";

export class MockSocketManager {
    private clientSocket;
    private serverProcess;

    public async init() {
        // launching a "mock socket server" so that we can mock a peer
        this.serverProcess = fork(__dirname + "/index.js");

        await delay(2000);

        // client socket so we can send mocking instructions to our mock server
        this.clientSocket = socketCluster.create({
            port: 4009,
            hostname: "127.0.0.1",
        });
    }

    public async emit(event, data) {
        return new Promise((resolve, reject) => {
            this.clientSocket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });
    }

    public async addMock(endpoint, mockData, headers?) {
        if (endpoint.split(".").length === 1) {
            endpoint = `p2p.peer.${endpoint}`;
        }

        return this.clientSocket.emit("mock.add", {
            endpoint,
            value: {
                data: mockData,
                headers: headers || {
                    version: "2.2.1",
                    port: 4000,
                    height: 1,
                    "Content-Type": "application/json",
                },
            },
        });
    }

    public async resetMock(endpoint) {
        return this.clientSocket.emit("mock.reset", { endpoint: `p2p.peer.${endpoint}` });
    }

    public async resetAllMocks() {
        return this.clientSocket.emit("mock.resetAll", {});
    }

    public async addMiddlewareTerminate() {
        return this.clientSocket.emit("mock.terminate.add", {});
    }

    public async removeMiddlewareTerminate() {
        return this.clientSocket.emit("mock.terminate.remove", {});
    }

    public stopServer() {
        this.clientSocket.destroy();
        return this.serverProcess.kill();
    }
}
