import "jest-extended";

import { setUp } from "../setup";
import { DposState } from "../../../../packages/core-state/src/dpos/dpos";
import { Utils } from "@arkecosystem/core-kernel";
import { buildDelegateAndVoteWallets } from "./dpos.test";
import { WalletRepository } from "../../../../packages/core-state/src/wallets";
import { RoundInfo } from "@arkecosystem/core-kernel/dist/contracts/shared";
import { DposPreviousRoundStateProvider } from "@arkecosystem/core-kernel/dist/contracts/state";

let dposState: DposState;
let dposPreviousRoundStateProv: DposPreviousRoundStateProvider;
let walletRepo: WalletRepository;

beforeAll(async () => {
    const initialEnv = setUp();
    dposState = initialEnv.dPosState;
    dposPreviousRoundStateProv = initialEnv.dposPreviousRound;
    walletRepo = initialEnv.walletRepo;
});


describe("dposPreviousRound", () => {
    let round: RoundInfo;

    beforeEach(async () => {
        round = Utils.roundCalculator.calculateRound(1);
        
        buildDelegateAndVoteWallets(5, walletRepo);

        dposState.buildVoteBalances();
        dposState.buildDelegateRanking();
        round.maxDelegates = 5;
        dposState.setDelegatesRound(round);
        });

    describe("getAllDelegates", () => {
        it("should get all delegates", async () => {
            const previousRound = await dposPreviousRoundStateProv([], round);

            expect(previousRound.getAllDelegates()).toEqual(walletRepo.allByUsername());
        });
    });
    
    describe("getRoundDelegates", () => {
        it("should get round delegates", async () => {
            const previousRound = await dposPreviousRoundStateProv([], round);

            expect(previousRound.getRoundDelegates()).toContainAllValues(walletRepo.allByUsername() as any);
        });
    });
});