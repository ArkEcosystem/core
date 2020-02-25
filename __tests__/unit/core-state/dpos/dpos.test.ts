import "jest-extended";

import { setUp } from "../setup";
import { DposState } from "../../../../packages/core-state/src/dpos/dpos";

let dposState: DposState;

beforeAll(() => {
    const initialEnv = setUp();
    dposState = initialEnv.dPosState;
});

describe("dposPreviousRound", () => {
    describe("revert", () => {
        
    });
    describe("getAllDelegates", () => {

    });
    
    describe("getRoundDelegates", () => {

    });
});

describe("dpos", () => {

    describe("getRoundInfo", () => {

    });

    describe("getAllDelegates", () => {

    });

    describe("getActiveDelegates", () => {

    });

    describe("getRoundDelegates", () => {

    });

    describe("buildVoteBalances", () => {

    });

    describe("buildDelegateRanking", () => {

    });

    describe("setDelegatesRound", () => {

    });
});
