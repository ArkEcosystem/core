import "jest-extended";

import { setUp, setUpDefaults } from "./setup";
import { StateBuilder } from "@arkecosystem/core-state/src/state-builder";
import { Enums, Utils } from "@arkecosystem/core-kernel";
import { WalletRepository } from "@arkecosystem/core-state/src/wallets";

let stateBuilder: StateBuilder;
let getBlockRewardsSpy: jest.SpyInstance;
let getSentTransactionSpy: jest.SpyInstance;
let getRegisteredHandlersSpy: jest.SpyInstance;
let dispatchSpy: jest.SpyInstance;
const generatorKey = setUpDefaults.getBlockRewards.generatorPublicKey;
let walletRepo: WalletRepository;

beforeAll(async () => {
    const initialEnv = setUp();

    walletRepo = initialEnv.walletRepo;
    stateBuilder = initialEnv.stateBuilder;

    getBlockRewardsSpy = initialEnv.spies.getBlockRewardsSpy;
    getSentTransactionSpy = initialEnv.spies.getSentTransactionSpy;
    getRegisteredHandlersSpy = initialEnv.spies.getRegisteredHandlersSpy;
    dispatchSpy = initialEnv.spies.dispatchSpy;
});

describe("StateBuilder", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should call block repository to get intial block rewards", async () => {
        await stateBuilder.run();

        expect(getBlockRewardsSpy).toHaveBeenCalled();
    });

    it("should get registered handlers", async () => {
        await stateBuilder.run();

        expect(getRegisteredHandlersSpy).toHaveBeenCalled();
    });

    it("should get sent transactions", async () => {
        await stateBuilder.run();

        expect(getSentTransactionSpy).toHaveBeenCalled();
    });

    it("should apply block rewards to generator wallet", async () => {
        const wallet = walletRepo.findByPublicKey(generatorKey);
        wallet.balance = Utils.BigNumber.ZERO;
        walletRepo.reindex(wallet);
        const expectedBalance = wallet.balance.plus(setUpDefaults.getBlockRewards.rewards);
        
        await stateBuilder.run();

        expect(wallet.balance).toEqual(expectedBalance);
    });

    it("should emit an event when the builder is finished", async () => {
        await stateBuilder.run();

        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });
});