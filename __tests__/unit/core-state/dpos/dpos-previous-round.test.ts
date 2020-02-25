import "jest-extended";

import { setUp } from "../setup";
import { DposState } from "../../../../packages/core-state/src/dpos/dpos";
import { DposPreviousRoundStateProvider } from "@arkecosystem/core-kernel/dist/contracts/state";
import { Utils } from "@arkecosystem/core-kernel";

let dposState: DposState;
let dposPreviousRoundStateProv: DposPreviousRoundStateProvider;

beforeAll(async () => {
    const initialEnv = setUp();
    dposState = initialEnv.dPosState;
    dposPreviousRoundStateProv = initialEnv.dposPreviousRound;
});

describe("dposPreviousRound", () => {

    beforeEach(async () => {
        const previousRound = await dposPreviousRoundStateProv([], Utils.roundCalculator.calculateRound(1));
    });

    describe("revert", () => {
        it("should do something", () => {
            expect("hello").not.toEqual("goodbye");
        });
    });
    describe("getAllDelegates", () => {

    });
    
    describe("getRoundDelegates", () => {

    });
});