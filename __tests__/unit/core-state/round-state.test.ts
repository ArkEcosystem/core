import { Container } from "@packages/core-kernel";
import { RoundState } from "@packages/core-state/src/round-state";
import { Sandbox } from "@packages/core-test-framework";

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

describe("RoundState", () => {
    describe("GetBlocksForRound", () => {
        it("should return empty array if there are no blocks", async () => {
            stateStore.getLastBlock.mockReturnValueOnce(undefined);
            databaseService.getLastBlock.mockResolvedValueOnce(undefined);

            const roundInfo = { roundHeight: 52, maxDelegates: 51 };
            const result = await roundState.getBlocksForRound(roundInfo as any);

            expect(stateStore.getLastBlock).toBeCalled();
            expect(databaseService.getLastBlock).toBeCalled();
            expect(result).toEqual([]);
        });

        it("should return array with genesis block only when last block is genesis block", async () => {
            const lastBlock = { data: { height: 1 } };
            stateStore.getLastBlock.mockReturnValueOnce(lastBlock);

            const roundInfo = { roundHeight: 1, maxDelegates: 51 };
            const result = await roundState.getBlocksForRound(roundInfo as any);

            expect(stateStore.getLastBlock).toBeCalled();
            expect(result).toEqual([lastBlock]);
        });
    });
});
