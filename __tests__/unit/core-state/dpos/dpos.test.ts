import "jest-extended";

import { Utils } from "@packages/core-kernel/src";
import { RoundInfo } from "@packages/core-kernel/src/contracts/shared";
import { DposState } from "@packages/core-state/src/dpos/dpos";
import { WalletRepository } from "@packages/core-state/src/wallets";
import { Utils as CryptoUtils } from "@packages/crypto/src";
import { SATOSHI } from "@packages/crypto/src/constants";

import { buildDelegateAndVoteWallets } from "../__utils__/build-delegate-and-vote-balances";
import { setUp } from "../setup";

let dposState: DposState;
let walletRepo: WalletRepository;
let debugLogger: jest.SpyInstance;

beforeAll(async () => {
    const initialEnv = await setUp();
    dposState = initialEnv.dPosState;
    walletRepo = initialEnv.walletRepo;
    debugLogger = initialEnv.spies.logger.debug;
});

describe("dpos", () => {
    beforeEach(() => {
        walletRepo.reset();

        buildDelegateAndVoteWallets(5, walletRepo);
    });

    describe("buildVoteBalances", () => {
        it("should update delegate votes of htlc locked balances", async () => {
            dposState.buildVoteBalances();

            const delegates = walletRepo.allByUsername();
            for (let i = 0; i < 5; i++) {
                const delegate = delegates[4 - i];
                expect(delegate.getAttribute<CryptoUtils.BigNumber>("delegate.voteBalance")).toEqual(
                    CryptoUtils.BigNumber.make(5 - i)
                        .times(1000)
                        .times(SATOSHI),
                );
            }
        });
    });

    describe("buildDelegateRanking", () => {
        it("should build ranking and sort delegates by vote balance", async () => {
            dposState.buildVoteBalances();
            dposState.buildDelegateRanking();

            const delegates = dposState.getActiveDelegates();

            for (let i = 0; i < 5; i++) {
                const delegate = delegates[i];
                expect(delegate.getAttribute<number>("delegate.rank")).toEqual(i + 1);
                expect(delegate.getAttribute<CryptoUtils.BigNumber>("delegate.voteBalance")).toEqual(
                    CryptoUtils.BigNumber.make((5 - i) * 1000 * SATOSHI),
                );
            }
        });

        it("should throw if two wallets have the same public key", () => {
            const delegates = buildDelegateAndVoteWallets(5, walletRepo);
            delegates[0].setAttribute("delegate.resigned", true);

            delegates[1].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
            delegates[2].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
            delegates[1].setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
            delegates[2].setPublicKey("03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece");
            walletRepo.index(delegates[2]);

            expect(() => dposState.buildDelegateRanking()).toThrow(
                'The balance and public key of both delegates are identical! Delegate "delegate2" appears twice in the list.',
            );
        });

        it("should not throw if public keys are different and balances are the same", () => {
            const delegates = buildDelegateAndVoteWallets(5, walletRepo);

            delegates[1].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));
            delegates[2].setAttribute("delegate.voteBalance", Utils.BigNumber.make(5467));

            expect(() => dposState.buildDelegateRanking()).not.toThrow();
            expect(delegates[1].getAttribute("delegate.rank")).toEqual(1);
            expect(delegates[2].getAttribute("delegate.rank")).toEqual(2);
            expect(delegates[0].getAttribute("delegate.rank")).toEqual(3);
        });
    });

    describe("setDelegatesRound", () => {
        it("should throw if there are not enough delegates", () => {
            dposState.buildVoteBalances();
            dposState.buildDelegateRanking();
            const round = Utils.roundCalculator.calculateRound(1);
            const errorMessage = `Expected to find 51 delegates but only found 5.This indicates an issue with the genesis block & delegates`;
            expect(() => dposState.setDelegatesRound(round)).toThrowError(errorMessage);
        });

        it("should set the delegates of a round", () => {
            dposState.buildVoteBalances();
            dposState.buildDelegateRanking();
            const round = Utils.roundCalculator.calculateRound(1);
            round.maxDelegates = 4;
            dposState.setDelegatesRound(round);
            const delegates = dposState.getActiveDelegates();
            const roundDelegates = dposState.getRoundDelegates();
            expect(dposState.getRoundInfo()).toEqual(round);
            expect(roundDelegates).toEqual(delegates.slice(0, 4));

            for (let i = 0; i < round.maxDelegates; i++) {
                const delegate = walletRepo.findByPublicKey(roundDelegates[i].getPublicKey()!);
                expect(delegate.getAttribute("delegate.round")).toEqual(round.round);
            }
            // TODO: when we remove Assertion checks, this won't throw
            // instead it should not.toEqual(round)
            expect(() => delegates[4].getAttribute("delegate.round")).toThrow();

            expect(debugLogger).toHaveBeenCalledWith("Loaded 4 active delegates");
        });
    });

    describe("getters", () => {
        let round: RoundInfo;

        beforeEach(() => {
            dposState.buildVoteBalances();
            dposState.buildDelegateRanking();
            round = Utils.roundCalculator.calculateRound(1);
            round.maxDelegates = 5;
            dposState.setDelegatesRound(round);
        });

        it("getRoundInfo", () => {
            expect(dposState.getRoundInfo()).toEqual(round);
        });

        it("getAllDelegates", () => {
            expect(dposState.getAllDelegates()).toEqual(walletRepo.allByUsername());
        });

        it("getActiveDelegates", () => {
            expect(dposState.getActiveDelegates()).toContainAllValues(walletRepo.allByUsername() as any);
        });

        it("getRoundDelegates", () => {
            expect(dposState.getRoundDelegates()).toContainAllValues(walletRepo.allByUsername() as any);
        });
    });
});
