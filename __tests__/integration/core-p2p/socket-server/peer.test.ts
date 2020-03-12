import "jest-extended";

import "../mocks/core-container";
import { defaults } from "../mocks/p2p-options";

import { Blocks, Managers } from "@arkecosystem/crypto/src";
import unitnetMilestones from "@arkecosystem/crypto/src/networks/unitnet/milestones.json";
import delay from "delay";
import net from "net";
import SocketCluster from "socketcluster";
import socketCluster from "socketcluster-client";
import { startSocketServer } from "../../../../packages/core-p2p/src/socket-server";
import { BlockFactory } from "../../../helpers";
import { createPeerService } from "../../../helpers/peers";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { wallets } from "../../../utils/fixtures/unitnet/wallets";

Managers.configManager.setFromPreset("unitnet");

let server: SocketCluster;
let socket;
let connect;
let emit;
let invalidOpcode;
let ping;
let pong;
let send;

const headers = {
    version: "2.1.0",
    port: 4009,
    height: 1,
    "Content-Type": "application/json",
};

beforeAll(async () => {
    process.env.CORE_ENV = "test";
    defaults.remoteAccess = []; // empty for rate limit tests

    const { service, processor } = createPeerService();

    jest.setTimeout(10000);

    server = await startSocketServer(service, { server: { port: 4007, workers: 1 } });
    await delay(1000);

    socket = socketCluster.create({
        port: 4007,
        hostname: "127.0.0.1",
    });
    socket.on("error", () => {
        //
    });

    connect = () => socket.connect();

    emit = (event, data) =>
        new Promise((resolve, reject) => {
            socket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });

    send = data => socket.send(data);

    ping = () => socket.transport.socket.ping();
    pong = () => socket.transport.socket.pong();
    invalidOpcode = () => socket.transport.socket._socket.write(Buffer.from("8780d0b6fbd2", "hex"));

    jest.spyOn(processor, "validateAndAcceptPeer").mockImplementation(jest.fn());
});

afterAll(() => {
    socket.destroy();
    server.destroy();

    jest.setTimeout(5000);
});

describe("Server initialization", () => {
    it("should init the server with correct maxPayload value", async () => {
        expect(server.options.maxPayload).toBe(unitnetMilestones[0].block.maxPayload + 10 * 1024); // unitnet milestones maxPayload + 1024 margin
    });
});

describe("Peer socket endpoint", () => {
    describe("socket endpoints", () => {
        it("should getPeers", async () => {
            const { data } = await emit("p2p.peer.getPeers", {
                headers,
                data: {},
            });

            expect(data).toBeArray();
        });

        it("should getStatus", async () => {
            const { data } = await emit("p2p.peer.getStatus", {
                headers,
                data: {},
            });

            expect(data.state.height).toBe(1);
        });

        describe("postBlock", () => {
            it("should postBlock successfully", async () => {
                await delay(1000);
                const dummyBlock = BlockFactory.createDummy();
                const { data } = await emit("p2p.peer.postBlock", {
                    data: {
                        block: Blocks.Serializer.serializeWithTransactions({
                            ...dummyBlock.data,
                            transactions: dummyBlock.transactions.map(tx => tx.data),
                        }),
                    },
                    headers,
                });

                expect(data).toEqual({});
            });

            it("should throw error when sending wrong data", async () => {
                await delay(1000);
                await expect(
                    emit("p2p.peer.postBlock", {
                        data: {},
                        headers,
                    }),
                ).rejects.toHaveProperty("name", "BadConnectionError");
                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should throw error when sending wrong buffer", async () => {
                await delay(1000);
                await expect(
                    emit("p2p.peer.postBlock", {
                        data: {
                            block: Buffer.from("oopsThisIsNotABlockBuffer"),
                        },
                        headers,
                    }),
                ).rejects.toHaveProperty("name", "Error");
                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should throw error if too many transactions are in the block", async () => {
                await delay(2000);
                const dummyBlock = BlockFactory.createDummy();
                const transaction = TransactionFactory.transfer(wallets[0].address, 111)
                    .withNetwork("unitnet")
                    .withPassphrase("one two three")
                    .build();

                for (let i = 0; i < 1000; i++) {
                    dummyBlock.transactions.push(transaction[0]);
                }

                dummyBlock.data.numberOfTransactions = 1000;

                await expect(
                    emit("p2p.peer.postBlock", {
                        data: {
                            block: Blocks.Serializer.serializeWithTransactions({
                                ...dummyBlock.data,
                                transactions: dummyBlock.transactions.map(tx => tx.data),
                            }),
                        },
                        headers,
                    }),
                ).rejects.toHaveProperty("name", "Error");
            });
        });

        describe("postTransactions", () => {
            it("should get back 'transaction list is not conform' error when transactions are invalid (already in cache)", async () => {
                const transactions = TransactionFactory.transfer(wallets[0].address, 111)
                    .withNetwork("unitnet")
                    .withPassphrase("one two three")
                    .create(15);

                // TODO: test makes no sense anymore
                await expect(
                    emit("p2p.peer.postTransactions", {
                        data: { transactions },
                        headers,
                    }),
                ).toResolve();
                // because our mocking makes all transactions to be invalid (already in cache)
            });

            it("should reject when sending too much transactions", async () => {
                const transactions = TransactionFactory.transfer(wallets[0].address, 111)
                    .withNetwork("unitnet")
                    .withPassphrase("one two three")
                    .create(50);

                await expect(
                    emit("p2p.peer.postTransactions", {
                        data: { transactions },
                        headers,
                    }),
                ).toReject();

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should disconnect the client if it sends an invalid message payload", async () => {
                connect();
                await delay(1000);

                expect(socket.state).toBe("open");

                send("Invalid payload");
                await delay(1000);

                expect(socket.state).toBe("closed");

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should disconnect the client if it sends too many pongs too quickly", async () => {
                connect();
                await delay(1000);

                expect(socket.state).toBe("open");

                send("#2");
                await delay(1000);

                expect(socket.state).toBe("open");

                send("#2");
                send("#2");
                await delay(1000);

                expect(socket.state).toBe("closed");

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should disconnect the client if it sends a ping frame", async () => {
                connect();
                await delay(1000);

                expect(socket.state).toBe("open");

                ping();
                await delay(500);
                expect(socket.state).toBe("closed");

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should disconnect the client if it sends a pong frame", async () => {
                connect();
                await delay(1000);

                expect(socket.state).toBe("open");

                pong();
                await delay(500);
                expect(socket.state).toBe("closed");

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });

            it("should block the client if it sends an invalid opcode", async () => {
                connect();
                await delay(1000);

                expect(socket.state).toBe("open");

                invalidOpcode();
                await delay(500);
                expect(socket.state).toBe("closed");
                await delay(500);
                connect();
                await delay(500);
                expect(socket.state).toBe("closed");

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
            });
        });
    });

    describe("Socket errors", () => {
        it("should disconnect all sockets from same ip if another connection is made from the same IP address", async () => {
            connect();
            await delay(1000);

            expect(socket.state).toBe("open");

            const secondSocket = socketCluster.create({
                port: 4007,
                hostname: "127.0.0.1",
                multiplex: false,
            });
            secondSocket.on("error", () => {
                //
            });

            secondSocket.connect();

            await delay(1000);

            expect(socket.state).toBe("closed");
            expect(secondSocket.state).toBe("open");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should disconnect the client if it sends multiple handshakes", async () => {
            connect(); // this automatically sends the first handshake
            await delay(1000);

            expect(socket.state).toBe("open");

            // this is the second handshake
            send('{"event": "#handshake", "data": {}, "cid": 1}');
            await delay(500);

            expect(socket.state).toBe("closed");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should accept the request when below rate limit", async () => {
            connect();
            await delay(1000);
            for (let i = 0; i < 2; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                    data: {},
                });
                expect(data.state.height).toBeNumber();
            }
            await delay(1100);
            for (let i = 0; i < 2; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                    data: {},
                });
                expect(data.state.height).toBeNumber();
            }
        });

        it("should cancel the request when exceeding rate limit", async () => {
            await delay(1000);
            for (let i = 0; i < 2; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                    data: {},
                });
                expect(data.state.height).toBeNumber();
            }

            await expect(
                emit("p2p.peer.getStatus", {
                    headers,
                    data: {},
                }),
            ).rejects.toHaveProperty("name", "BadConnectionError");
        });

        it("should cancel the request when exceeding rate limit on a certain endpoint", async () => {
            await delay(1000);

            const block = BlockFactory.createDummy();

            const postBlock = () =>
                emit("p2p.peer.postBlock", {
                    headers,
                    data: {
                        block: Blocks.Serializer.serializeWithTransactions({
                            ...block.data,
                            transactions: block.transactions.map(tx => tx.data),
                        }),
                    },
                });

            await expect(postBlock()).toResolve();
            await expect(postBlock()).toResolve();
            await expect(postBlock()).rejects.toHaveProperty("name", "BadConnectionError");

            await expect(
                emit("p2p.peer.getStatus", {
                    headers,
                    data: {},
                }),
            ).toResolve();

            await delay(4000);

            await expect(postBlock()).toResolve();
        });

        it("should close the connection when the event length is > 128", async () => {
            await delay(1000);

            await expect(
                emit(
                    "p2p.internal.eventNameIsTooLongSoShouldCloseTheConnectionWithCode4413AsItTheEventNameExceedsTheMaximumPermittedLengthSizeOf128Characters",
                    {
                        headers,
                        data: {},
                    },
                ),
            ).rejects.toHaveProperty("name", "BadConnectionError");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection when the event does not start with p2p", async () => {
            connect();
            await delay(1000);

            await expect(
                emit("p3p.peer.getStatus", {
                    headers,
                    data: {},
                }),
            ).rejects.toHaveProperty("name", "BadConnectionError");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection when the version is invalid", async () => {
            connect();
            await delay(1000);

            await expect(
                emit("p2p.invalid.getStatus", {
                    headers,
                    data: {},
                }),
            ).rejects.toHaveProperty("name", "BadConnectionError");
            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection and prevent reconnection if blocked", async () => {
            connect();
            await delay(1000);

            await emit("p2p.peer.getPeers", {
                headers,
                data: {},
            });

            expect(socket.state).toBe("open");

            for (let i = 0; i < 100; i++) {
                await expect(
                    emit("p2p.peer.getPeers", {
                        headers,
                        data: {},
                    }),
                ).rejects.toHaveProperty("name", "BadConnectionError");
            }

            expect(socket.state).not.toBe("open");

            socket.connect();
            await delay(1000);

            expect(socket.state).not.toBe("open");
            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection when using unsupported event messages", async () => {
            connect();
            await delay(1000);

            await expect(
                emit("#subscribe", {
                    headers,
                    data: {},
                }),
            ).rejects.toHaveProperty("name", "BadConnectionError");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection if it sends data after a disconnect packet", async () => {
            connect();
            await delay(1000);

            send('{"event":"#disconnect","data":{"code":4000}}');
            await expect(
                emit("p2p.peer.getStatus", {
                    headers,
                }),
            ).rejects.toHaveProperty("name", "BadConnectionError");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection when the JSON includes additional properties", async () => {
            connect();
            await delay(1000);
            const payload: any = {};
            payload.event = "p2p.peer.getCommonBlocks";
            payload.data = { data: { ids: ["1"] }, headers: {} };
            payload.cid = 1;

            const symbol = String.fromCharCode(42);
            for (let i = 0; i < 30000; i++) {
                const char = String.fromCharCode(i);
                if (JSON.stringify(String.fromCharCode(i)).length === 3) {
                    payload.data[char] = 1;
                    payload.data[symbol + char] = 1;
                    payload.data[symbol + char + symbol] = 1;
                    payload.data[char] = 1;
                }
            }

            const stringifiedPayload = JSON.stringify(payload).replace(/ /g, "");
            expect(socket.state).toBe("open");
            send(stringifiedPayload);
            await delay(500);
            expect(socket.state).not.toBe("open");

            // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
            server.killWorkers({ immediate: true });
            await delay(2000); // give time to workers to respawn
        });

        it("should close the connection when the HTTP url is not valid", async done => {
            const socket = new net.Socket();
            socket.connect(4007, "127.0.0.1", async () => {
                socket.write("GET /invalid/ HTTP/1.0\r\n\r\n");
                await delay(500);
                expect(socket.destroyed).toBe(true);

                socket.connect(4007, "127.0.0.1");
                await delay(500);
                expect(socket.destroyed).toBe(true);

                // kill workers to reset ipLastError (or we won't pass handshake for 1 minute)
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
                done();
            });
        });

        it("should close the connection if the initial HTTP request is not processed within 2 seconds", async done => {
            const socket = new net.Socket();
            await delay(2000);
            socket.connect(4007, "127.0.0.1", async () => {
                await delay(500);
                expect(socket.destroyed).toBe(false);
                await delay(2000);
                expect(socket.destroyed).toBe(true);
                server.killWorkers({ immediate: true });
                await delay(2000); // give time to workers to respawn
                done();
            });
        });

        it("should close the connection if is is not fully established from start to finish within 4 seconds", async done => {
            const socket = new net.Socket();
            await delay(2000);
            socket.connect(4007, "127.0.0.1", async () => {
                expect(socket.destroyed).toBe(false);
                // @ts-ignore
                socket.write(`GET /${server.options.path}/ HTTP/1.0\r\n`);
                socket.write("Host: 127.0.0.1");
                await delay(1500);
                expect(socket.destroyed).toBe(false);
                socket.write("Host: 127.0.0.1");
                await delay(1500);
                expect(socket.destroyed).toBe(false);
                socket.write("Host: 127.0.0.1");
                await delay(1500);
                expect(socket.destroyed).toBe(true);
                done();
            });
        });
    });
});
