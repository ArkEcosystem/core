import { Application, Container, Contracts } from "@packages/core-kernel";
import { Peer } from "@packages/core-p2p/src/peer";
import { PeerVerificationResult, PeerVerifier } from "@packages/core-p2p/src/peer-verifier";
import { Blocks } from "@packages/crypto";

describe("PeerVerifier", () => {
    let app: Application;
    let peerVerifier: PeerVerifier;
    let peer: Peer;

    const peerCommunicator: Contracts.P2P.PeerCommunicator = {
        initialize: jest.fn(),
        postBlock: jest.fn(),
        postTransactions: jest.fn(),
        ping: jest.fn(),
        pingPorts: jest.fn(),
        getPeers: jest.fn(),
        getPeerBlocks: jest.fn(),
        hasCommonBlocks: jest.fn(),
    };

    const logger = { warning: console.log, debug: console.log, info: console.log };
    const trigger = { call: jest.fn() };
    const stateStore = { getLastBlocks: jest.fn(), getLastHeight: jest.fn() };
    const database = {};
    const databaseInterceptor = {
        getBlocksByHeight: jest.fn(),
    };
    const dposState = { getRoundInfo: jest.fn(), getRoundDelegates: jest.fn() };

    const blockFromDataMock = (blockData) =>
        ({
            verifySignature: () => true,
            data: {
                height: blockData.height,
                generatorPublicKey: blockData.generatorPublicKey,
            },
        } as Blocks.Block);
    const blockWithIdFromDataMock = (blockData) =>
        ({
            verifySignature: () => true,
            data: {
                id: blockData.id,
                height: blockData.height,
                generatorPublicKey: blockData.generatorPublicKey,
            },
        } as Blocks.Block);
    const notVerifiedBlockFromDataMock = (blockData) =>
        ({
            verifySignature: () => false,
            data: {
                height: blockData.height,
                generatorPublicKey: blockData.generatorPublicKey,
            },
        } as Blocks.Block);

    beforeAll(() => {
        process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA = "true";

        app = new Application(new Container.Container());

        app.container.unbindAll();
        app.bind(Container.Identifiers.LogService).toConstantValue(logger);
        app.bind(Container.Identifiers.TriggerService).toConstantValue(trigger);
        app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        app.bind(Container.Identifiers.DatabaseInterceptor).toConstantValue(databaseInterceptor);
        app.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
        app.bind(Container.Identifiers.Application).toConstantValue(app);
        app.bind(Container.Identifiers.DposState).toConstantValue(dposState);
        app.bind(Container.Identifiers.PeerCommunicator).toConstantValue(peerCommunicator);
    });

    beforeEach(() => {
        jest.resetAllMocks();
        peer = new Peer("176.165.56.77", 4000);

        peerVerifier = app.resolve<PeerVerifier>(PeerVerifier);
        peerVerifier.initialize(peer);
    });

    describe("checkState", () => {
        describe("when claimed state block header does not match claimed state height", () => {
            it("should return undefined", async () => {
                const claimedState: Contracts.P2P.PeerState = {
                    height: 18,
                    forgingAllowed: false,
                    currentSlot: 18,
                    header: {
                        height: 19,
                        id: "13965046748333390338",
                    },
                };

                expect(await peerVerifier.checkState(claimedState, Date.now() + 2000)).toBeUndefined();
            });
        });

        describe("when Case1. Peer height > our height and our highest block is part of the peer's chain", () => {
            it("should return PeerVerificationResult not forked", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                const claimedState: Contracts.P2P.PeerState = {
                    height: 18,
                    forgingAllowed: false,
                    currentSlot: 18,
                    header: {
                        height: 18,
                        id: "13965046748333390338",
                        generatorPublicKey,
                    },
                };
                const ourHeader = {
                    height: 15,
                    id: "11165046748333390338",
                };

                stateStore.getLastHeight = jest.fn().mockReturnValue(ourHeader.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValue([{ data: { height: ourHeader.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest.fn().mockImplementation((blockHeights) =>
                    blockHeights.map((height: number) => ({
                        height,
                        id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                    })),
                );
                peerCommunicator.hasCommonBlocks = jest.fn().mockImplementation((_, ids) => ({
                    id: ids[ids.length - 1],
                    height: parseInt(ids[ids.length - 1].slice(0, 2)),
                }));
                trigger.call = jest.fn().mockReturnValue([
                    {
                        getPublicKey: () => {
                            return generatorPublicKey;
                        },
                    },
                ]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest
                    .spyOn(Blocks.BlockFactory, "fromData")
                    .mockImplementation(blockWithIdFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeFalse();

                const resultAlreadyVerified = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(resultAlreadyVerified).toBeInstanceOf(PeerVerificationResult);
                expect(resultAlreadyVerified.forked).toBeFalse();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                databaseInterceptor.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
                stateStore.getLastHeight = jest.fn();
                trigger.call = jest.fn();
                stateStore.getLastBlocks = jest.fn();
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
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(ourHeader.height)
                    .mockReturnValueOnce(ourHeader.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: ourHeader.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest.fn().mockImplementation((blockHeights) =>
                    blockHeights.map((height: number) => ({
                        height,
                        id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                    })),
                );
                peerCommunicator.hasCommonBlocks = jest
                    .fn()
                    .mockImplementation((_, ids) => ({ id: ids[0], height: parseInt(ids[0].slice(0, 2)) }));
                trigger.call = jest.fn().mockReturnValue([
                    {
                        getPublicKey: () => {
                            return generatorPublicKey;
                        },
                    },
                ]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeTrue();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                databaseInterceptor.getBlocksByHeight = jest.fn();
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
                databaseInterceptor.getBlocksByHeight = jest.fn().mockReturnValueOnce([{ id: claimedState.header.id }]);

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

            it.each([[true], [false]])(
                "should return PeerVerificationResult forked when claimed state block header is valid",
                async (delegatesEmpty) => {
                    const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                    stateStore.getLastHeight = jest
                        .fn()
                        .mockReturnValueOnce(claimedState.height)
                        .mockReturnValueOnce(claimedState.height);
                    stateStore.getLastBlocks = jest
                        .fn()
                        .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                    databaseInterceptor.getBlocksByHeight = jest
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

                    if (delegatesEmpty) {
                        // getActiveDelegates return empty array, should still work using dpos state
                        trigger.call = jest.fn().mockReturnValue([]); // getActiveDelegates mock
                        dposState.getRoundInfo = jest
                            .fn()
                            .mockReturnValueOnce({ round: 1, maxDelegates: 51 })
                            .mockReturnValueOnce({ round: 1, maxDelegates: 51 });
                        dposState.getRoundDelegates = jest
                            .fn()
                            .mockReturnValueOnce([
                                {
                                    getPublicKey: () => {
                                        return generatorPublicKey;
                                    },
                                },
                            ])
                            .mockReturnValueOnce([
                                {
                                    getPublicKey: () => {
                                        return generatorPublicKey;
                                    },
                                },
                            ]);
                    } else {
                        trigger.call = jest.fn().mockReturnValue([
                            {
                                getPublicKey: () => {
                                    return generatorPublicKey;
                                },
                            },
                        ]); // getActiveDelegates mock
                    }

                    peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                        const blocks = [];
                        for (
                            let i = options.fromBlockHeight + 1;
                            i <= options.fromBlockHeight + options.blockLimit;
                            i++
                        ) {
                            blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                        }
                        return blocks;
                    });
                    const spyFromData = jest
                        .spyOn(Blocks.BlockFactory, "fromData")
                        .mockImplementation(blockFromDataMock);

                    const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                    expect(result).toBeInstanceOf(PeerVerificationResult);
                    expect(result.forked).toBeTrue();

                    spyFromData.mockRestore();
                    peerCommunicator.getPeerBlocks = jest.fn();
                    databaseInterceptor.getBlocksByHeight = jest.fn();
                    peerCommunicator.hasCommonBlocks = jest.fn();
                },
            );

            it("should return undefined when claimed state block header is invalid", async () => {
                stateStore.getLastHeight = jest.fn().mockReturnValue(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValue([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                jest.spyOn(Blocks.BlockFactory, "fromData").mockReturnValue({
                    verifySignature: () => false,
                } as Blocks.Block);

                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                trigger.call = jest.fn().mockReturnValue([{ publicKey: generatorPublicKey }]); // getActiveDelegates mock
                stateStore.getLastBlocks = jest.fn();

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should return undefined when peer does not return common blocks", async () => {
                stateStore.getLastHeight = jest.fn().mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
                    .fn()
                    .mockReturnValueOnce([{ id: ourHeader.id }])
                    .mockImplementation((blockHeights) =>
                        blockHeights.map((height: number) => ({
                            height,
                            id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                        })),
                    );
                peerCommunicator.hasCommonBlocks = jest.fn();

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should throw when state.getLastHeight does not return a height", async () => {
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockRejectedValueOnce(undefined);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
                    .fn()
                    .mockReturnValueOnce([{ id: ourHeader.id }])
                    .mockImplementation((blockHeights) =>
                        blockHeights.map((height: number) => ({
                            height,
                            id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                        })),
                    );
                peerCommunicator.hasCommonBlocks = jest.fn();
                jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                await expect(peerVerifier.checkState(claimedState, Date.now() + 2000)).toReject();
            });

            it("should return undefined when peer returns no common block", async () => {
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
                    .fn()
                    .mockReturnValueOnce([{ id: ourHeader.id }])
                    .mockImplementation((blockHeights) =>
                        blockHeights.map((height: number) => ({
                            height,
                            id: height.toString().padStart(2, "0").repeat(20), // just using height to mock the id
                        })),
                    );
                peerCommunicator.hasCommonBlocks = jest.fn().mockResolvedValueOnce(undefined);
                jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should return undefined when peer returns unexpected id for common block", async () => {
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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
                    .mockImplementation((_, ids) => ({ id: "unexpectedId", height: parseInt(ids[0].slice(0, 2)) }));
                jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should return undefined when peer returns unexpected height for common block", async () => {
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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
                    .mockImplementation((_, ids) => ({ id: ids[0], height: 1000 + parseInt(ids[0].slice(0, 2)) }));
                jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it.each([[true], [false]])(
                "should return undefined when getPeerBlocks returns empty or rejects",
                async (returnEmpty) => {
                    stateStore.getLastHeight = jest
                        .fn()
                        .mockReturnValueOnce(claimedState.height)
                        .mockReturnValueOnce(claimedState.height);
                    stateStore.getLastBlocks = jest
                        .fn()
                        .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                    databaseInterceptor.getBlocksByHeight = jest
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
                    jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);
                    const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                    trigger.call = jest.fn().mockReturnValue([
                        {
                            getPublicKey: () => {
                                return generatorPublicKey;
                            },
                        },
                    ]); // getActiveDelegates mock

                    if (returnEmpty) {
                        peerCommunicator.getPeerBlocks = jest.fn().mockResolvedValueOnce([]);
                    } else {
                        peerCommunicator.getPeerBlocks = jest.fn().mockRejectedValueOnce(new Error("timeout"));
                    }

                    const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                    expect(result).toBeUndefined();
                },
            );

            it("should return undefined when peer returns block that does not verify", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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

                trigger.call = jest.fn().mockReturnValue([
                    {
                        getPublicKey: () => {
                            return generatorPublicKey;
                        },
                    },
                ]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                jest.spyOn(Blocks.BlockFactory, "fromData")
                    .mockImplementationOnce(blockFromDataMock)
                    .mockImplementation(notVerifiedBlockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should return undefined when peer returns block that does not verify", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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

                trigger.call = jest.fn().mockReturnValue([
                    {
                        getPublicKey: () => {
                            return generatorPublicKey;
                        },
                    },
                ]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i + 3000, generatorPublicKey }); // wrong height block
                    }
                    return blocks;
                });
                jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should return undefined when peer returns block that is not signed by expected delegate", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                const randomPublicKey = "03c5282b639d0e8f94cfac7777242d1634d78a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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

                trigger.call = jest.fn().mockReturnValue([
                    {
                        getPublicKey: () => {
                            return generatorPublicKey;
                        },
                    },
                ]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey: randomPublicKey }); // wrong generator public key
                    }
                    return blocks;
                });
                jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeUndefined();
            });

            it("should throw when deadline is passed", async () => {
                const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(claimedState.height)
                    .mockReturnValueOnce(claimedState.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: claimedState.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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
                trigger.call = jest.fn().mockReturnValue([{ publicKey: generatorPublicKey }]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                await expect(peerVerifier.checkState(claimedState, Date.now() - 1)).rejects.toEqual(
                    new Error("timeout elapsed before successful completion of the verification"),
                );

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                databaseInterceptor.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
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
                databaseInterceptor.getBlocksByHeight = jest.fn().mockReturnValueOnce([{ id: claimedState.header.id }]);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeFalse();
            });
        });

        describe("when Case6. Peer height < our height and peer's latest block is not part of our chain", () => {
            const generatorPublicKey = "03c5282b639d0e8f94cfac6c0ed242d1634d8a2c93cbd76c6ed2856a9f19cf6a13";
            const claimedState: Contracts.P2P.PeerState = {
                height: 12,
                forgingAllowed: false,
                currentSlot: 12,
                header: {
                    height: 12,
                    id: "13965046748333390338",
                    generatorPublicKey,
                },
            };
            const ourHeader = {
                height: 15,
                id: "11165046748333390338",
            };

            it("should return PeerVerificationResult forked", async () => {
                stateStore.getLastHeight = jest
                    .fn()
                    .mockReturnValueOnce(ourHeader.height)
                    .mockReturnValueOnce(ourHeader.height);
                stateStore.getLastBlocks = jest
                    .fn()
                    .mockReturnValueOnce([{ data: { height: ourHeader.height }, getHeader: () => ourHeader }]);
                databaseInterceptor.getBlocksByHeight = jest
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
                trigger.call = jest.fn().mockReturnValue([
                    {
                        getPublicKey: () => {
                            return generatorPublicKey;
                        },
                    },
                ]); // getActiveDelegates mock
                peerCommunicator.getPeerBlocks = jest.fn().mockImplementation((_, options) => {
                    const blocks = [];
                    for (let i = options.fromBlockHeight + 1; i <= options.fromBlockHeight + options.blockLimit; i++) {
                        blocks.push({ id: i.toString(), height: i, generatorPublicKey });
                    }
                    return blocks;
                });
                const spyFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation(blockFromDataMock);

                const result = await peerVerifier.checkState(claimedState, Date.now() + 2000);

                expect(result).toBeInstanceOf(PeerVerificationResult);
                expect(result.forked).toBeTrue();

                spyFromData.mockRestore();
                peerCommunicator.getPeerBlocks = jest.fn();
                databaseInterceptor.getBlocksByHeight = jest.fn();
                peerCommunicator.hasCommonBlocks = jest.fn();
            });
        });
    });
});
