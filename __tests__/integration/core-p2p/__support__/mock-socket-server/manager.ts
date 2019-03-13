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
        return this.clientSocket.emit("mock.add", {
            endpoint: `p2p.peer.${endpoint}`,
            value: {
                data: mockData,
                headers: headers || {
                    version: "2.2.1",
                    port: 4000,
                    nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
                    height: 1,
                    "Content-Type": "application/json",
                    hashid: "a4e0e642",
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

    public stopServer() {
        return this.serverProcess.kill();
    }
}
