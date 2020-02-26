import "jest-extended";

import { setUp } from "./setup";
import { StateBuilder } from "@arkecosystem/core-state/src/state-builder";
import { Enums } from "@arkecosystem/core-kernel";

let stateBuilder: StateBuilder;
let getBlockRewardsSpy: jest.SpyInstance;
let getSentTransactionSpy: jest.SpyInstance;
let getRegisteredHandlersSpy: jest.SpyInstance;
let dispatchSpy: jest.SpyInstance;

beforeAll(async () => {
    const initialEnv = setUp();
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

    it("should emit an event when the builder is finished", async () => {
        await stateBuilder.run();

        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });
});