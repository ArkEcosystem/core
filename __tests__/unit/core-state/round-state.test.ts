import { Container } from "@packages/core-kernel";
import { RoundState } from "@packages/core-state/src/round-state";
import { Sandbox } from "@packages/core-test-framework";
import { Blocks, Identities, Utils } from "@packages/crypto";

import block1760000 from "./__fixtures__/block1760000";

let sandbox: Sandbox;
let roundState: RoundState;

let databaseService;
let dposState;
let getDposPreviousRoundState;
let stateStore;
let walletRepository;
let triggerService;
let eventDispatcher;
let logger;

beforeEach(() => {
    databaseService = {
        getLastBlock: jest.fn(),
        getBlocks: jest.fn(),
        getRound: jest.fn(),
        saveRound: jest.fn(),
        deleteRound: jest.fn(),
    };
    dposState = {
        buildDelegateRanking: jest.fn(),
        setDelegatesRound: jest.fn(),
        getRoundDelegates: jest.fn(),
    };
    getDposPreviousRoundState = jest.fn();
    stateStore = {
        setGenesisBlock: jest.fn(),
        getGenesisBlock: jest.fn(),
        setLastBlock: jest.fn(),
        getLastBlock: jest.fn(),
        getLastBlocksByHeight: jest.fn(),
        getCommonBlocks: jest.fn(),
        getLastBlockIds: jest.fn(),
    };
    walletRepository = {
        createWallet: jest.fn(),
        findByPublicKey: jest.fn(),
        findByUsername: jest.fn(),
    };
    triggerService = {
        call: jest.fn(),
    };
    eventDispatcher = {
        call: jest.fn(),
        dispatch: jest.fn(),
    };
    logger = {
        error: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.DatabaseService).toConstantValue(databaseService);
    sandbox.app.bind(Container.Identifiers.DposState).toConstantValue(dposState);
    sandbox.app.bind(Container.Identifiers.DposPreviousRoundStateProvider).toConstantValue(getDposPreviousRoundState);
    sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
    sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
    sandbox.app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
    sandbox.app.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);
    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    roundState = sandbox.app.resolve<RoundState>(RoundState);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("RoundState", () => {
    describe("getBlocksForRound", () => {
        it("should return array with genesis block only when round 1 is requested", async () => {
            const lastBlock = { data: { height: 1 } };
            stateStore.getGenesisBlock.mockReturnValueOnce(lastBlock);

            const roundInfo = { round: 1, roundHeight: 1, maxDelegates: 51 };
            const result = await roundState.getBlocksForRound(roundInfo as any);

            expect(stateStore.getGenesisBlock).toBeCalled();
            expect(result).toEqual([lastBlock]);
        });

        it("should return array with genesis block only when last block is genesis blocks", async () => {
            const lastBlock = { data: { height: 1 } };
            stateStore.getLastBlock.mockReturnValueOnce(lastBlock);
            stateStore.getGenesisBlock.mockReturnValueOnce(lastBlock);

            const result = await roundState.getBlocksForRound();

            expect(stateStore.getLastBlock).toBeCalled();
            expect(stateStore.getGenesisBlock).toBeCalled();
            expect(result).toEqual([lastBlock]);
        });

        it("should return array of blocks by round", async () => {
            // @ts-ignore
            const spyOnFromData = jest.spyOn(Blocks.BlockFactory, "fromData").mockImplementation((block) => {
                return block;
            });

            const blocks = Array(51).fill({ data: { height: 2 } });
            databaseService.getBlocks.mockReturnValueOnce(blocks);

            const roundInfo = { round: 2, roundHeight: 2, nextRound: 3, maxDelegates: 51 };
            const result = await roundState.getBlocksForRound(roundInfo);

            expect(databaseService.getBlocks).toBeCalledWith(2, 52);
            expect(spyOnFromData).toBeCalledTimes(51);
            expect(result).toEqual(blocks);

            spyOnFromData.mockClear();
        });
    });

    describe("getActiveDelegates", () => {
        it("should return shuffled round delegates", async () => {
            const lastBlock = Blocks.BlockFactory.fromData(block1760000);
            stateStore.getLastBlock.mockReturnValue(lastBlock);

            const delegatePublicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
            const delegateVoteBalance = Utils.BigNumber.make("100");
            const roundDelegateModel = { publicKey: delegatePublicKey, balance: delegateVoteBalance };
            databaseService.getRound.mockResolvedValueOnce([roundDelegateModel]);

            const newDelegateWallet = { setAttribute: jest.fn(), clone: jest.fn() };
            walletRepository.createWallet.mockReturnValueOnce(newDelegateWallet);

            const oldDelegateWallet = { getAttribute: jest.fn() };
            walletRepository.findByPublicKey.mockReturnValueOnce(oldDelegateWallet);

            const delegateUsername = "test_delegate";
            oldDelegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

            const cloneDelegateWallet = {};
            newDelegateWallet.clone.mockReturnValueOnce(cloneDelegateWallet);

            // @ts-ignore
            const spyOnShuffleDelegates = jest.spyOn(roundState, "shuffleDelegates");

            await roundState.getActiveDelegates();

            expect(walletRepository.findByPublicKey).toBeCalledWith(delegatePublicKey);
            expect(walletRepository.createWallet).toBeCalledWith(Identities.Address.fromPublicKey(delegatePublicKey));
            expect(oldDelegateWallet.getAttribute).toBeCalledWith("delegate.username");
            expect(newDelegateWallet.setAttribute).toBeCalledWith("delegate", {
                voteBalance: delegateVoteBalance,
                username: delegateUsername,
                round: 34510,
            });
            expect(newDelegateWallet.clone).toBeCalled();
            expect(spyOnShuffleDelegates).toBeCalled();
        });

        it("should return cached forgingDelegates when round is the same", async () => {
            const forgingDelegate = { getAttribute: jest.fn() };
            const forgingDelegateRound = 2;
            forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
            // @ts-ignore
            roundState.forgingDelegates = [forgingDelegate] as any;

            const roundInfo = { round: 2 };
            const result = await roundState.getActiveDelegates(roundInfo as any);

            expect(forgingDelegate.getAttribute).toBeCalledWith("delegate.round");
            // @ts-ignore
            expect(result).toBe(roundState.forgingDelegates);
        });
    });

    describe("setForgingDelegatesOfRound", () => {
        it("should call getActiveDelegates and set forgingDelegatesOfRound", async () => {
            const delegate = {
                username: "dummy_delegate",
            };
            triggerService.call.mockResolvedValue([delegate]);

            const roundInfo = { round: 2, roundHeight: 2, nextRound: 3, maxDelegates: 51 };
            // @ts-ignore
            await roundState.setForgingDelegatesOfRound(roundInfo, [delegate]);

            expect(triggerService.call).toHaveBeenCalledWith("getActiveDelegates", {
                delegates: [delegate],
                roundInfo,
            });

            // @ts-ignore
            expect(roundState.forgingDelegates).toEqual([delegate]);
        });

        it("should call getActiveDelegates and set forgingDelegatesOfRound to [] if undefined is returned", async () => {
            const delegate = {
                username: "dummy_delegate",
            };
            triggerService.call.mockResolvedValue(undefined);

            const roundInfo = { round: 2, roundHeight: 2, nextRound: 3, maxDelegates: 51 };
            // @ts-ignore
            await roundState.setForgingDelegatesOfRound(roundInfo, [delegate]);

            expect(triggerService.call).toHaveBeenCalledWith("getActiveDelegates", {
                delegates: [delegate],
                roundInfo,
            });

            // @ts-ignore
            expect(roundState.forgingDelegates).toEqual([]);
        });
    });

    describe("applyBlock", () => {
        it("should build delegates, save round, dispatch events when height is 1", async () => {
            const forgingDelegate = { getAttribute: jest.fn() };
            const forgingDelegateRound = 1;
            forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
            // @ts-ignore
            roundState.forgingDelegates = [forgingDelegate] as any;

            // @ts-ignore
            roundState.blocksInCurrentRound = [];

            const delegateWallet = { publicKey: "delegate public key", getAttribute: jest.fn() };
            const dposStateRoundDelegates = [delegateWallet];
            dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
            dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

            const delegateWalletRound = 1;
            delegateWallet.getAttribute.mockReturnValueOnce(delegateWalletRound);

            walletRepository.findByPublicKey.mockReturnValueOnce(delegateWallet);

            const delegateUsername = "test_delegate";
            delegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

            const height = 1;
            // @ts-ignore
            await roundState.applyRound(height);

            expect(dposState.buildDelegateRanking).toBeCalled();
            expect(dposState.setDelegatesRound).toBeCalledWith({
                round: 1,
                nextRound: 1,
                roundHeight: 1,
                maxDelegates: 51,
            });
            expect(databaseService.saveRound).toBeCalledWith(dposStateRoundDelegates);
            expect(eventDispatcher.dispatch).toBeCalledWith("round.applied");
        });

        it("should build delegates, save round, dispatch events, and skip missing round checks when first round has genesis block only", async () => {
            const forgingDelegate = { getAttribute: jest.fn() };
            const forgingDelegateRound = 1;
            forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
            // @ts-ignore
            roundState.forgingDelegates = [forgingDelegate] as any;

            // @ts-ignore
            roundState.blocksInCurrentRound = [{ data: { height: 1 } }] as any;

            const delegateWallet = { publicKey: "delegate public key", getAttribute: jest.fn() };
            const dposStateRoundDelegates = [delegateWallet];
            dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);
            dposState.getRoundDelegates.mockReturnValueOnce(dposStateRoundDelegates);

            const delegateWalletRound = 2;
            delegateWallet.getAttribute.mockReturnValueOnce(delegateWalletRound);

            walletRepository.findByPublicKey.mockReturnValueOnce(delegateWallet);

            const delegateUsername = "test_delegate";
            delegateWallet.getAttribute.mockReturnValueOnce(delegateUsername);

            const height = 51;
            // @ts-ignore
            await roundState.applyRound(height);

            expect(dposState.buildDelegateRanking).toBeCalled();
            expect(dposState.setDelegatesRound).toBeCalledWith({
                round: 2,
                nextRound: 2,
                roundHeight: 52,
                maxDelegates: 51,
            });
            expect(databaseService.saveRound).toBeCalledWith(dposStateRoundDelegates);
            expect(eventDispatcher.dispatch).toBeCalledWith("round.applied");
        });

        it("should delete round and rethrow error when error was thrown", async () => {
            dposState.buildDelegateRanking.mockImplementation(() => {
                throw new Error("Fail");
            });

            await expect(roundState.applyRound(51)).rejects.toThrowError("Fail");

            expect(databaseService.deleteRound).toBeCalledWith(2);
        });

        it("should do nothing when next height is same round", async () => {
            await roundState.applyRound(50);
            expect(logger.info).not.toBeCalled();
        });

        it("should warn when, and do nothing when round was already applied", async () => {
            const forgingDelegate = { getAttribute: jest.fn() };
            const forgingDelegateRound = 2;
            forgingDelegate.getAttribute.mockReturnValueOnce(forgingDelegateRound);
            // @ts-ignore
            roundState.forgingDelegates = [forgingDelegate] as any;

            await roundState.applyRound(51);

            expect(logger.warning).toBeCalledWith(
                "Round 2 has already been applied. This should happen only if you are a forger.",
            );
        });
    });

    describe("revertRound", () => {
        it("should revert, and delete round when reverting to previous round", async () => {
            const lastBlock = Blocks.BlockFactory.fromData(block1760000);
            // @ts-ignore
            jest.spyOn(roundState, "getBlocksForRound").mockResolvedValue([lastBlock.data]);

            const prevRoundState = { getAllDelegates: jest.fn(), getRoundDelegates: jest.fn(), revert: jest.fn() };
            getDposPreviousRoundState.mockReturnValueOnce(prevRoundState).mockReturnValueOnce(prevRoundState);

            const prevRoundDelegateWallet = { getAttribute: jest.fn() };
            const prevRoundDposStateAllDelegates = [prevRoundDelegateWallet];
            prevRoundState.getAllDelegates.mockReturnValueOnce(prevRoundDposStateAllDelegates);

            const prevRoundDelegateUsername = "test_delegate";
            prevRoundDelegateWallet.getAttribute.mockReturnValueOnce(prevRoundDelegateUsername);

            const delegateWallet = { setAttribute: jest.fn(), getAttribute: jest.fn() };
            walletRepository.findByUsername.mockReturnValueOnce(delegateWallet);

            const prevRoundDelegateRank = 1;
            prevRoundDelegateWallet.getAttribute.mockReturnValueOnce(prevRoundDelegateRank);

            const prevRoundDposStateRoundDelegates = [prevRoundDelegateWallet];
            prevRoundState.getRoundDelegates.mockReturnValueOnce(prevRoundDposStateRoundDelegates);

            const forgingDelegates = [delegateWallet];
            triggerService.call.mockResolvedValue(forgingDelegates);

            await roundState.revertRound(51);

            expect(getDposPreviousRoundState).toBeCalled();
            expect(walletRepository.findByUsername).toBeCalledWith(prevRoundDelegateUsername);
            expect(delegateWallet.setAttribute).toBeCalledWith("delegate.rank", prevRoundDelegateRank);
            // @ts-ignore
            expect(roundState.forgingDelegates).toEqual(forgingDelegates);
            expect(databaseService.deleteRound).toBeCalledWith(2);
        });
    });
});
