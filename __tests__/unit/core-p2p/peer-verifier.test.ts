import { Container, Application, Contracts } from "@arkecosystem/core-kernel";

import { PeerVerifier, PeerVerificationResult } from "@arkecosystem/core-p2p/src/peer-verifier";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { Blocks } from "@arkecosystem/crypto";

describe("PeerVerifier", () => {
    let app: Application;
    let peerVerifier: PeerVerifier;
    let peer: Peer;
    let peerCommunicator: Contracts.P2P.PeerCommunicator;

    const logger = { warning: console.log, debug: console.log, info: console.log };
    const trigger = { call: jest.fn() };
    const stateStore = { getLastBlocks: jest.fn(), getLastHeight: jest.fn() };
    const database = { getBlocksByHeight: jest.fn() };
    const dposState = {};

    beforeAll(() => {
        process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA = "true";

        app = new Application(new Container.Container());

        app.container.unbindAll();
        app.bind(Container.Identifiers.LogService).toConstantValue(logger);
        app.bind(Container.Identifiers.TriggerService).toConstantValue(trigger);
        app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        app.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        app.bind(Container.Identifiers.Application).toConstantValue(app);
        app.bind(Container.Identifiers.DposState).toConstantValue(dposState);
    });

    beforeEach(() => {
        peer = new Peer("176.165.56.77", 4000);
        peerCommunicator = {
            initialize: jest.fn(),
            postBlock: jest.fn(),
            postTransactions: jest.fn(),
            ping: jest.fn(),
            pingPorts: jest.fn(),
            getPeers: jest.fn(),
            getPeerBlocks: jest.fn(),
            hasCommonBlocks: jest.fn(),
        };

        peerVerifier = app.resolve<PeerVerifier>(PeerVerifier);
        peerVerifier.initialize(peerCommunicator, peer);
    });

    describe("checkState", () => {
        describe("when Case1. Peer height > our height and our highest block is part of the peer's chain", () => {
            const claimedState: Contracts.P2P.PeerState = {
                height: 18,
                forgingAllowed: false,
                currentSlot: 18,
                header: {
                    height: 18,
                    id: "13965046748333390338",
                },
            };
            const ourHeader = {
                height: 15,
                id: "11165046748333390338",
            };

            it("should return PeerVerificationResult not forked", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(ourHeader.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: ourHeader.height }, getHeader: () => ourHeader }]);
                database.getBlocksByHeight = jest.fn().mockImplementation((blockHeights) =>
                    blockHeights.map((height: number) => ({
                        height,
                        id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                    })),
                );
                peerCommunicator.hasCommonBlocks = jest
                    .fn()
                    .mockImplementation((_, ids) => ({
                        id: ids[ids.length - 1],
                        height: parseInt(ids[ids.length - 1].slice(0, 2)),
                    }));
                trigger.call = jest.fn().mockReturnValueOnce([{ publicKey: generatorPublicKey }]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(
                    (blockData) =>
                        ({
                            verifySignature: () => true,
                            data: {
                                height: blockData.height,
                                generatorPublicKey: blockData.generatorPublicKey,
                            },
                        } as Blocks.Block),
                );

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeFalse();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                database.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
            });
        });

        describe("when Case2. Peer height > our height and our highest block is not part of the peer's chain", () => {
            const claimedState: Contracts.P2P.PeerState = {
                height: 18,
                forgingAllowed: false,
                currentSlot: 18,
                header: {
                    height: 18,
                    id: "13965046748333390338",
                },
            };
            const ourHeader = {
                height: 15,
                id: "11165046748333390338",
            };

            it("should return PeerVerificationResult forked", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(ourHeader.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: ourHeader.height }, getHeader: () => ourHeader }]);
                database.getBlocksByHeight = jest.fn().mockImplementation((blockHeights) =>
                    blockHeights.map((height: number) => ({
                        height,
                        id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                    })),
                );
                peerCommunicator.hasCommonBlocks = jest
                    .fn()
                    .mockImplementation((_, ids) => ({ id: ids[0], height: parseInt(ids[0].slice(0, 2)) }));
                trigger.call = jest.fn().mockReturnValueOnce([{ publicKey: generatorPublicKey }]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(
                    (blockData) =>
                        ({
                            verifySignature: () => true,
                            data: {
                                height: blockData.height,
                                generatorPublicKey: blockData.generatorPublicKey,
                            },
                        } as Blocks.Block),
                );

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeTrue();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                database.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
            });
        });

        describe("when Case3. Peer height == our height and our latest blocks are the same", () => {
            const claimedState: Contracts.P2P.PeerState = {
                height: 15,
                forgingAllowed: false,
                currentSlot: 15,
                header: {
                    height: 15,
                    id: "13965046748333390338",
                },
            };

            it("should return PeerVerificationResult not forked", async () => {
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([
                        { data: { height: claimedState.height }, getHeader: () => claimedState.header },
                    ]);
                database.getBlocksByHeight = jest.fn().mockReturnValueOnce([{ id: claimedState.header.id }]);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeFalse();
            });
        });

        describe("when Case4. Peer height == our height and our latest blocks differ", () => {
            const claimedState: Contracts.P2P.PeerState = {
                height: 15,
                forgingAllowed: false,
                currentSlot: 15,
                header: {
                    height: 15,
                    id: "13965046748333390338",
                },
            };
            const ourHeader = {
                height: 15,
                id: "11165046748333390338",
            };

            it("should return PeerVerificationResult forked when claimed state block header is valid", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                database.getBlocksByHeight = jest
                    .fn()
                    .mockReturnValueOnce([{ id: ourHeader.id }])
                    .mockImplementation((blockHeights) =>
                        blockHeights.map((height: number) => ({
                            height,
                            id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                        })),
                    );
                peerCommunicator.hasCommonBlocks = jest
                    .fn()
                    .mockImplementation((_, ids) => ({ id: ids[0], height: parseInt(ids[0].slice(0, 2)) }));
                trigger.call = jest.fn().mockReturnValueOnce([{ publicKey: generatorPublicKey }]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(
                    (blockData) =>
                        ({
                            verifySignature: () => true,
                            data: {
                                height: blockData.height,
                                generatorPublicKey: blockData.generatorPublicKey,
                            },
                        } as Blocks.Block),
                );

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeTrue();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                database.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
            });

            it("should return undefined when claimed state block header is invalid", async () => {
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                jest.spyOn(Blocks.BlockFactory, "fromData").mockReturnValueOnce({
                    verifySignature: () => false,
                } as Blocks.Block);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });
        });

        describe("when Case5. Peer height < our height and peer's latest block is part of our chain", () => {
            const claimedState: Contracts.P2P.PeerState = {
                height: 15,
                forgingAllowed: false,
                currentSlot: 15,
                header: {
                    height: 15,
                    id: "13965046748333390338",
                },
            };
            const ourHeight = claimedState.height + 2;
            const ourHeader = {
                height: ourHeight,
                id: "6857401089891373446",
            };

            it("should return PeerVerificationResult not forked", async () => {
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(ourHeight);
                stateStore.getLastBlocks = jest.fn().mockReturnValueOnce([
                    { data: { height: ourHeight }, getHeader: () => ourHeader },
                    { data: { height: claimedState.height }, getHeader: () => claimedState.header },
                ]);
                database.getBlocksByHeight = jest.fn().mockReturnValueOnce([{ id: claimedState.header.id }]);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeFalse();
            });
        });

        describe("when Case6. Peer height < our height and peer's latest block is not part of our chain", () => {
            const claimedState: Contracts.P2P.PeerState = {
                height: 12,
                forgingAllowed: false,
                currentSlot: 12,
                header: {
                    height: 12,
                    id: "13965046748333390338",
                },
            };
            const ourHeader = {
                height: 15,
                id: "11165046748333390338",
            };

            it("should return PeerVerificationResult forked", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(ourHeader.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: ourHeader.height }, getHeader: () => ourHeader }]);
                database.getBlocksByHeight = jest
                    .fn()
                    .mockReturnValueOnce([{ id: ourHeader.id }])
                    .mockImplementation((blockHeights) =>
                        blockHeights.map((height: number) => ({
                            height,
                            id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                        })),
                    );
                peerCommunicator.hasCommonBlocks = jest
                    .fn()
                    .mockImplementation((_, ids) => ({ id: ids[0], height: parseInt(ids[0].slice(0, 2)) }));
                trigger.call = jest.fn().mockReturnValueOnce([{ publicKey: generatorPublicKey }]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(
                    (blockData) =>
                        ({
                            verifySignature: () => true,
                            data: {
                                height: blockData.height,
                                generatorPublicKey: blockData.generatorPublicKey,
                            },
                        } as Blocks.Block),
                );

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeTrue();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                database.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
            });
        });
    });
});
