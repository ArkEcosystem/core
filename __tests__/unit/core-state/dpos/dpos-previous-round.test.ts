import "jest-extended";

import { setUp } from "../setup";
import { DposState } from "@packages/core-state/src/dpos/dpos";
import { Utils } from "@packages/core-kernel/src";
import { buildDelegateAndVoteWallets } from "./dpos.test";
import { WalletRepository } from "@packages/core-state/src/wallets";
import { RoundInfo } from "@packages/core-kernel/src/contracts/shared";
import { DposPreviousRoundStateProvider } from "@packages/core-kernel/src/contracts/state";
import { DposPreviousRoundState } from "@packages/core-state/src/dpos";
import { makeChainedBlocks, makeVoteTransactions } from "../helper";
import { addTransactionsToBlock } from "../block-state.test";
import { IBlock } from "@packages/crypto/src/interfaces";

let dposState: DposState;
let dposPreviousRoundStateProv: DposPreviousRoundStateProvider;
let walletRepo: WalletRepository;
let factory;
let blockState;

beforeAll(async () => {
    const initialEnv = setUp();
    dposState = initialEnv.dPosState;
    dposPreviousRoundStateProv = initialEnv.dposPreviousRound;
    walletRepo = initialEnv.walletRepo;
    factory = initialEnv.factory;
    blockState = initialEnv.blockState;
});


describe("dposPreviousRound", () => {
    let round: RoundInfo;
    let blocks: IBlock[];

    beforeEach(async () => {
        walletRepo.reset();
        
        round = Utils.roundCalculator.calculateRound(1);
        
        buildDelegateAndVoteWallets(5, walletRepo);

        dposState.buildVoteBalances();
        dposState.buildDelegateRanking();
        round.maxDelegates = 5;
        dposState.setDelegatesRound(round);

        blocks = makeChainedBlocks(101, factory.get("Block"));

        jest.clearAllMocks();
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

    describe("revert", () => {
        it("should revert blocks", async () => {
            const generatorWallet = walletRepo.findByPublicKey(blocks[0].data.generatorPublicKey);

            generatorWallet.setAttribute("delegate", {
                username: "test",
                forgedFees: Utils.BigNumber.ZERO,
                forgedRewards: Utils.BigNumber.ZERO,
                producedBlocks: 0,
                lastBlock: undefined,
            });
    
            walletRepo.reindex(generatorWallet);

            addTransactionsToBlock(
                makeVoteTransactions(
                    3, 
                    [`+${"03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37"}`]
                ),
                blocks[0]
            );
            blocks[0].data.height = 2;

            await blockState.applyBlock(blocks[0]);

            const previousRound: DposPreviousRoundState = await dposPreviousRoundStateProv([], round) as any;


            // TODO: fix this test, these aren't being called because of IoC tagging
            jest.spyOn(dposState, "buildDelegateRanking");
            jest.spyOn(dposState, "setDelegatesRound");
            jest.spyOn(blockState, "revertBlock");

            previousRound.revert([blocks[0]], round);
            
            expect(dposState.buildDelegateRanking).toHaveBeenCalled();
            expect(dposState.setDelegatesRound).toHaveBeenCalledWith(round);
            expect(blockState.revertBlock).toHaveBeenCalledWith(blocks[0]);
        });

        it("should not revert the blocks when height is one", async () => {
            const previousRound: DposPreviousRoundState = await dposPreviousRoundStateProv([], round) as any;
            blocks[0].data.height = 1;

            previousRound.revert([blocks[0]], round);

            jest.spyOn(dposState, "buildDelegateRanking");
            jest.spyOn(dposState, "setDelegatesRound");
            jest.spyOn(blockState, "revertBlock");

            expect(dposState.buildDelegateRanking).not.toHaveBeenCalled();
            expect(dposState.setDelegatesRound).not.toHaveBeenCalled();
            expect(blockState.revertBlock).not.toHaveBeenCalled();
        });
    });
});