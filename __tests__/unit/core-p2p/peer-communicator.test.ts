import { Container, Utils as KernelUtils } from "@arkecosystem/core-kernel";

import { PeerCommunicator } from "@arkecosystem/core-p2p/src/peer-communicator";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { Blocks, Managers, Utils } from "@arkecosystem/crypto";
import { PeerStatusResponseError, PeerVerificationFailedError, PeerPingTimeoutError } from "@arkecosystem/core-p2p/src/errors";
import delay from "delay";
import { PeerVerificationResult } from "@arkecosystem/core-p2p/src/peer-verifier";

const cloneObject = (obj) => JSON.parse(JSON.stringify(obj));

describe("PeerCommunicator", () => {
    let peerCommunicator: PeerCommunicator;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() };
    const configuration = { getOptional: jest.fn(), getRequired: jest.fn() };
    const peerVerifier = { initialize: () => {}, checkState: jest.fn() };
    peerVerifier.initialize = () => peerVerifier;
    const app = { resolve: (_) => peerVerifier, getTagged: () => configuration };
    const emitter = { dispatch: jest.fn() };
    const connector = { forgetError: jest.fn(), connect: jest.fn(), emit: jest.fn(), setError: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(emitter);
        container.bind(Container.Identifiers.PeerConnector).toConstantValue(connector);
        container.bind(Container.Identifiers.PeerCommunicator).to(PeerCommunicator);
    });

    beforeEach(() => {
        peerCommunicator = container.get<PeerCommunicator>(Container.Identifiers.PeerCommunicator);
        peerCommunicator.initialize();

        jest.resetAllMocks();
    });

    describe("postBlock", () => {
        it("should use connector to emit p2p.peer.postBlock", async () => {
            const event = "p2p.peer.postBlock";
            const block = {
                data: {
                    id: "17882607875259085966",
                    version: 0,
                    timestamp: 46583330,
                    height: 2,
                    reward: Utils.BigNumber.make("0"),
                    previousBlock: "17184958558311101492",
                    numberOfTransactions: 0,
                    totalAmount: Utils.BigNumber.make("0"),
                    totalFee: Utils.BigNumber.make("0"),
                    payloadLength: 0,
                    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                    blockSignature:
                        "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
                },
                transactions: [],
            } as Blocks.Block;
            const payload = { block };
            const peer = new Peer("187.168.65.65", 4000);

            await peerCommunicator.postBlock(peer, payload.block);

            expect(connector.emit).toBeCalledTimes(1);
            expect(connector.emit).toBeCalledWith(peer, event, { block: expect.any(Buffer) });
        })
    });

    describe("postTransactions", () => {
        it("should use connector to emit p2p.peer.postTransactions", async () => {
            const event = "p2p.peer.postTransactions";
            const payload = { transactions: [] };
            const peer = new Peer("187.168.65.65", 4000);

            await peerCommunicator.postTransactions(peer, payload.transactions);

            expect(connector.emit).toBeCalledTimes(1);
            expect(connector.emit).toBeCalledWith(peer, event, payload);
        })
    });
    describe("ping", () => {
        const baseGetStatusResponse = {
            config: {
                network: {
                    name: "testnet",
                    nethash: Managers.configManager.get("network.nethash"),
                    explorer: "explorer.ark.io",
                    token: {
                        name: "TARK",
                        symbol: "TARK",
                    }
                },
                version: "3.0.0",
                plugins: {},
            },
            state: {
                height: 1,
                forgingAllowed: true,
                currentSlot: 1,
                header: {},
            }
        };

        it("should not call connector emit when peer.recentlyPinged() && !force", async () => {
            const peer = new Peer("187.168.65.65", 4000);
            jest.spyOn(peer, "recentlyPinged").mockReturnValue(true);

            await peerCommunicator.ping(peer, 1000, false);

            expect(connector.emit).toBeCalledTimes(0);
        })

        it("should throw PeerStatusResponseError when ping response is undefined", async () => {
            const event = "p2p.peer.getStatus";
            const peer = new Peer("187.168.65.65", 4000);

            await expect(peerCommunicator.ping(peer, 1000)).rejects.toThrow(PeerStatusResponseError);

            expect(connector.emit).toBeCalledTimes(1);
            expect(connector.emit).toBeCalledWith(peer, event, {});
        })

        describe("when !process.env.CORE_SKIP_PEER_STATE_VERIFICATION", () => {
            it("should throw PeerVerificationFailedError when peer config is not validated", async () => {
                const event = "p2p.peer.getStatus";
                const peer = new Peer("187.168.65.65", 4000);
                const pingResponse = cloneObject(baseGetStatusResponse);
                // just tweaking the base nethash to make it invalid
                pingResponse.config.network.nethash = pingResponse.config.network.nethash.replace("a", "b");

                connector.emit = jest.fn().mockReturnValueOnce({ payload: pingResponse });

                await expect(peerCommunicator.ping(peer, 1000)).rejects.toThrow(PeerVerificationFailedError);

                expect(connector.emit).toBeCalledTimes(1);
                expect(connector.emit).toBeCalledWith(peer, event, {});
            })

            it("should throw PeerPingTimeoutError when deadline is passed", async () => {
                const event = "p2p.peer.getStatus";
                const peer = new Peer("187.168.65.65", 4000);
                const pingResponse = baseGetStatusResponse;
                const timeout = 1000;
                connector.emit = jest.fn().mockImplementationOnce(async () => {
                    await delay(timeout);
                    return { payload: pingResponse };
                });
                configuration.getOptional = jest.fn().mockReturnValueOnce([baseGetStatusResponse.config.version]); // minimumVersions

                await expect(peerCommunicator.ping(peer, timeout)).rejects.toThrow(PeerPingTimeoutError);

                expect(connector.emit).toBeCalledTimes(1);
                expect(connector.emit).toBeCalledWith(peer, event, {});
            })

            it("should throw PeerVerificationFailedError when verification fails", async () => {
                const event = "p2p.peer.getStatus";
                const peer = new Peer("187.168.65.65", 4000);
                const pingResponse = baseGetStatusResponse;
                connector.emit = jest.fn().mockReturnValueOnce({ payload: pingResponse });
                configuration.getOptional = jest.fn().mockReturnValueOnce([baseGetStatusResponse.config.version]); // minimumVersions

                await expect(peerCommunicator.ping(peer, 1000)).rejects.toThrow(PeerVerificationFailedError);

                expect(connector.emit).toBeCalledTimes(1);
                expect(connector.emit).toBeCalledWith(peer, event, {});
            })

            it("should not throw otherwise", async () => {
                const event = "p2p.peer.getStatus";
                const peer = new Peer("187.168.65.65", 4000);
                const pingResponse = baseGetStatusResponse;
                connector.emit = jest.fn().mockReturnValueOnce({ payload: pingResponse });
                configuration.getOptional = jest.fn().mockReturnValueOnce([baseGetStatusResponse.config.version]); // minimumVersions
                peerVerifier.checkState = jest.fn().mockReturnValueOnce(new PeerVerificationResult(1, 1, 1));

                const pingResult = await peerCommunicator.ping(peer, 1000);

                expect(connector.emit).toBeCalledTimes(1);
                expect(connector.emit).toBeCalledWith(peer, event, {});
                expect(pingResult).toEqual(baseGetStatusResponse.state);
            })
        })

        describe("when process.env.CORE_SKIP_PEER_STATE_VERIFICATION", () => {
            it("should return pingResponse.state even when peer config is not valid", async () => {
                process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";

                const event = "p2p.peer.getStatus";
                const peer = new Peer("187.168.65.65", 4000);
                const pingResponse = cloneObject(baseGetStatusResponse);
                // just tweaking the base nethash to make it invalid
                pingResponse.config.network.nethash = pingResponse.config.network.nethash.replace("a", "b");

                connector.emit = jest.fn().mockReturnValueOnce({ payload: pingResponse });

                const pingResult = await peerCommunicator.ping(peer, 1000);

                expect(connector.emit).toBeCalledTimes(1);
                expect(connector.emit).toBeCalledWith(peer, event, {});
                expect(pingResult).toEqual(baseGetStatusResponse.state);
                expect(peer.state).toEqual(baseGetStatusResponse.state);
                expect(peer.plugins).toEqual(baseGetStatusResponse.config.plugins);

                delete process.env.CORE_SKIP_PEER_STATE_VERIFICATION;
            })
        })
    });

    describe("pingPorts", () => {
        it("should ping the peer's plugins ports and update peer.ports", async () => {
            const peer = new Peer("187.168.65.65", 4000);
            peer.plugins = {
                "core-api": { enabled: true, port: 4100 },
                "custom-plugin": { enabled: true, port: 4200 },
            }
            jest.spyOn(KernelUtils.http, "get")
                .mockResolvedValueOnce({ data: { data: { nethash: Managers.configManager.get("network.nethash") } }, statusCode: 200 } as any)
                .mockResolvedValueOnce({ data: {}, statusCode: 200 } as any);

            await peerCommunicator.pingPorts(peer);

            expect(peer.ports["core-api"]).toBe(4100);
            expect(peer.ports["custom-plugin"]).toBe(4200);
        })
    });

    describe("getPeers", () => {
        it("should use connector to emit p2p.peer.getPeers", async () => {
            const event = "p2p.peer.getPeers";
            const payload = {};
            const peer = new Peer("187.168.65.65", 4000);

            const mockConnectorResponse = { payload: [ { ip: "177.176.1.1", port: 4000 }] };
            connector.emit = jest.fn().mockReturnValueOnce(mockConnectorResponse);
            const getPeersResult = await peerCommunicator.getPeers(peer);

            expect(connector.emit).toBeCalledTimes(1);
            expect(connector.emit).toBeCalledWith(peer, event, payload);
            expect(getPeersResult).toEqual(mockConnectorResponse.payload);
        })
    });

    describe("hasCommonBlocks", () => {
        it("should use connector to emit p2p.peer.getCommonBlocks", async () => {
            const event = "p2p.peer.getCommonBlocks";
            const payload = { ids: ["1234567890"] };
            const peer = new Peer("187.168.65.65", 4000);

            const mockConnectorResponse = { payload: { common: { id: "1234567890", height: 123 }} };
            connector.emit = jest.fn().mockReturnValueOnce(mockConnectorResponse);
            const hasCommonBlocksResult = await peerCommunicator.hasCommonBlocks(peer, payload.ids);

            expect(connector.emit).toBeCalledTimes(1);
            expect(connector.emit).toBeCalledWith(peer, event, payload);
            expect(hasCommonBlocksResult).toEqual(mockConnectorResponse.payload.common);
        })
    });

    describe("getPeerBlocks", () => {
        const block = {
            data: {
                id: "17882607875259085966",
                version: 0,
                timestamp: 46583330,
                height: 2,
                reward: Utils.BigNumber.make("0"),
                previousBlock: "17184958558311101492",
                numberOfTransactions: 0,
                totalAmount: Utils.BigNumber.make("0"),
                totalFee: Utils.BigNumber.make("0"),
                payloadLength: 0,
                payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
                blockSignature:
                    "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            },
            transactions: [],
        } as Blocks.Block;

        it("should use connector to emit p2p.peer.getBlocks", async () => {
            const event = "p2p.peer.getBlocks";
            const options = {
                fromBlockHeight: 1,
                blockLimit: 1,
                headersOnly: true,
            };
            const peer = new Peer("187.168.65.65", 4000);

            const mockConnectorResponse = { payload: [block.data] };
            connector.emit = jest.fn().mockReturnValueOnce(mockConnectorResponse);
            const getPeerBlocksResult = await peerCommunicator.getPeerBlocks(peer, options);

            const expectedEmitPayload = {
                lastBlockHeight: options.fromBlockHeight,
                blockLimit: options.blockLimit,
                headersOnly: options.headersOnly,
                serialized: true,
            };
            expect(connector.emit).toBeCalledTimes(1);
            expect(connector.emit).toBeCalledWith(peer, event, expectedEmitPayload);
            expect(getPeerBlocksResult).toEqual(mockConnectorResponse.payload);
        })
    });
});