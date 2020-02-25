import "jest-extended";

import { setUp } from "../setup";
import { DposState } from "../../../../packages/core-state/src/dpos/dpos";
import { WalletRepository } from "../../../../packages/core-state/src/wallets";
import { Identities, Utils } from "@arkecosystem/crypto";
import { SATOSHI } from "@arkecosystem/crypto/dist/constants";

let dposState: DposState;
let walletRepo: WalletRepository;

beforeAll(() => {
    const initialEnv = setUp();
    dposState = initialEnv.dPosState;
    walletRepo = initialEnv.walletRepo;
});

describe("dpos", () => {

    beforeEach(() => {
        walletRepo.reset();
        for (let i = 0; i < 5; i++) {
            const delegateKey = i.toString().repeat(66);
            const delegate = walletRepo.createWallet(Identities.Address.fromPublicKey(delegateKey));
            delegate.publicKey = delegateKey;
            delegate.setAttribute("delegate.username", `delegate${i}`);
            delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);

            const voter = walletRepo.createWallet(Identities.Address.fromPublicKey((i + 5).toString().repeat(66)));
            const totalBalance = Utils.BigNumber.make(i + 1)
                .times(1000)
                .times(SATOSHI);
            voter.balance = totalBalance.div(2);
            voter.publicKey = `v${delegateKey}`;
            voter.setAttribute("vote", delegateKey);
            // TODO: is this correct?
            // that buildVoteBalances should only be triggered if there is a htlc lockedBalance?
            voter.setAttribute("htlc.lockedBalance", totalBalance.div(2));

            walletRepo.index([delegate, voter]);
        }
    });

    describe("getRoundInfo", () => {

    });

    describe("getAllDelegates", () => {

    });

    describe("getActiveDelegates", () => {

    });

    describe("getRoundDelegates", () => {

    });

    describe("buildVoteBalances", () => {
        it("should update delegate votes of htlc locked balances", async () => {
            dposState.buildVoteBalances();
    
            const delegates = walletRepo.allByUsername();
            for (let i = 0; i < 5; i++) {
                const delegate = delegates[4 - i];
                expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                    Utils.BigNumber.make(5 - i)
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
                expect(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance")).toEqual(
                    Utils.BigNumber.make((5 - i) * 1000 * SATOSHI),
                );
            }
        });
    });

    describe("setDelegatesRound", () => {

    });
});
