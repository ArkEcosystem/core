import "jest-extended";

import "../mocks/core-container";
import { defaults } from "../mocks/p2p-options";

import { Blocks, Managers } from "@arkecosystem/crypto/src";
import delay from "delay";
import SocketCluster from "socketcluster";
import socketCluster from "socketcluster-client";
import { startSocketServer } from "../../../../packages/core-p2p/src/socket-server";
import { createPeerService } from "../../../helpers/peers";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { genesisBlock } from "../../../utils/config/unitnet/genesisBlock";
import { wallets } from "../../../utils/fixtures/unitnet/wallets";

Managers.configManager.setFromPreset("unitnet");

let server: SocketCluster;
let socket;
let emit;

const headers = {
    version: "2.1.0",
    port: "4009",
    height: 1,
    "Content-Type": "application/json",
};

beforeAll(async () => {
    process.env.CORE_ENV = "test";
    defaults.remoteAccess = []; // empty for rate limit tests

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

afterAll(() => socket.destroy());

describe("Peer socket endpoint", () => {
    describe("socket endpoints", () => {
        it("should getPeers", async () => {
            const { data } = await emit("p2p.peer.getPeers", {
                headers,
            });

            expect(data).toBeArray();
        });

        it("should getStatus", async () => {
            const { data } = await emit("p2p.peer.getStatus", {
                headers,
            });

            expect(data.state.height).toBe(1);
        });

        describe("postBlock", () => {
            it("should postBlock successfully", async () => {
                const { data } = await emit("p2p.peer.postBlock", {
                    data: { block: Blocks.BlockFactory.fromData(genesisBlock).toJson() },
                    headers,
                });

                expect(data).toEqual({});
            });

            it("should throw validation error when sending wrong data", async () => {
                await expect(
                    emit("p2p.peer.postBlock", {
                        data: {},
                        headers,
                    }),
                ).rejects.toHaveProperty("name", "CoreValidationError");
            });
        });

        describe("postTransactions", () => {
            it("should get back 'transaction list is not conform' error when transactions are invalid (already in cache)", async () => {
                const transactions = TransactionFactory.transfer(wallets[0].address, 111)
                    .withNetwork("unitnet")
                    .withPassphrase("one two three")
                    .create(15);

                await expect(
                    emit("p2p.peer.postTransactions", {
                        data: { transactions },
                        headers,
                    }),
                ).rejects.toThrowError("The payload contains invalid transaction.");

                // because our mocking makes all transactions to be invalid (already in cache)
            });

            it("should throw validation error when sending too much transactions", async () => {
                const transactions = TransactionFactory.transfer(wallets[0].address, 111)
                    .withNetwork("unitnet")
                    .withPassphrase("one two three")
                    .create(50);

                await expect(
                    emit("p2p.peer.postTransactions", {
                        data: { transactions },
                        headers,
                    }),
                ).rejects.toHaveProperty("name", "CoreValidationError");
            });
        });
    });

    describe("Socket errors", () => {
        it("should send back an error if no data.headers", async () => {
            try {
                await emit("p2p.peer.getPeers", {});
            } catch (e) {
                expect(e.name).toEqual("CoreHeadersRequiredError");
                expect(e.message).toEqual("Request data and data.headers is mandatory");
            }
        });

        it("should not be disconnected / banned when below rate limit", async () => {
            await delay(1100);
            for (let i = 0; i < 18; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                });
                expect(data.state.height).toBeNumber();
            }
            await delay(1100);
            for (let i = 0; i < 10; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                });
                expect(data.state.height).toBeNumber();
            }
        });

        it("should be disconnected and banned when exceeding rate limit", async () => {
            const onSocketError = jest.fn();
            socket.on("error", onSocketError);

            await delay(1100);
            for (let i = 0; i < 299; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                });
                expect(data.state.height).toBeNumber();
            }
            // 20th call, should throw CoreRateLimitExceededError
            await expect(
                emit("p2p.peer.postBlock", {
                    data: {},
                    headers,
                }),
            ).rejects.toHaveProperty("name", "CoreRateLimitExceededError");

            // wait a bit for socket to be disconnected
            await delay(500);

            expect(onSocketError).toHaveBeenCalled();
            expect(socket.getState()).toBe("closed");
        });

        it("should not be disconnected and banned if is configured in remoteAccess", async () => {
            // need to restart the server for config changes to be updated
            defaults.remoteAccess = ["127.0.0.1", "::ffff:127.0.0.1"];
            server.destroy();
            await delay(2000);
            const { service } = createPeerService();
            server = await startSocketServer(service, { server: { port: 4007 } });

            await delay(1000);

            for (let i = 0; i < 300; i++) {
                const { data } = await emit("p2p.peer.getStatus", {
                    headers,
                });
                expect(data.state.height).toBeNumber();
            }

            expect(socket.getState()).toBe("open");
        });
    });
});
