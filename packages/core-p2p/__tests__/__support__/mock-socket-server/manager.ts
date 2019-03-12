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
                    version: "2.2.0-beta.4",
                    port: 4000,
                    nethash: "27acac9ce53a648f05ba43cdee17454ebb891f205a98196ad6a0ed761abc8e48",
                    height: 1,
                    "Content-Type": "application/json",
                    hashid: "a4e0e642",
                },
            },
        });
    }

    public async resetAllMocks() {
        return this.clientSocket.emit("mock.resetAll", {});
    }

    public stopServer() {
        return this.serverProcess.kill();
    }
}
