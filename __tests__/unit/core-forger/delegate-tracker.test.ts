import "jest-extended";

import { Utils } from "@arkecosystem/core-kernel";
import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { Wallet } from "@packages/core-state/src/wallets";
import { Crypto, Identities, Managers } from "@packages/crypto";

import { dummy } from "./__utils__/create-block-with-transactions";
import { mockLastBlock, setup } from "./setup";

let delegateTracker: DelegateTracker;
let attributeMap;
const activeDelegates = [];
let loggerDebug;

beforeEach(async () => {
    for (let i = 0; i < 51; i++) {
        const address = `Delegate-Wallet-${i}`;
        const wallet = new Wallet(address, attributeMap);
        wallet.publicKey = Identities.PublicKey.fromPassphrase(address);

        activeDelegates.push(wallet);
    }

    const initialEnv = await setup(activeDelegates);
    delegateTracker = initialEnv.sandbox.app.resolve<DelegateTracker>(DelegateTracker);

    loggerDebug = initialEnv.spies.logger.debug;
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();
});

describe("DelegateTracker", () => {
    describe("initialise", () => {
        it("should set-up delegates", async () => {
            const delegate = new BIP39(dummy.plainPassphrase);

            delegateTracker.initialize([delegate]);
            expect((delegateTracker as any).delegates).toEqual([delegate]);
        });
    });

    describe("handle", () => {
        let secondsToNextRound;
        beforeEach(() => {
            const height = mockLastBlock.data.height;
            const delegatesCount = Managers.configManager.getMilestone(height).activeDelegates;
            const blockTime: number = Managers.configManager.getMilestone(height).blocktime;

            secondsToNextRound = (delegatesCount - (height % delegatesCount)) * blockTime;
        });

        it("should handle and compute next forgers", async () => {
            delegateTracker.initialize(activeDelegates);
            await expect(delegateTracker.handle()).toResolve();
        });

        it("should log the next forgers and time to next round", async () => {
            delegateTracker.initialize([activeDelegates[0]]);

            jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(0);
            await delegateTracker.handle();

            expect(loggerDebug).toHaveBeenCalledWith(
                `Next Forgers: ${JSON.stringify(
                    activeDelegates.slice(2, 7).map((delegate: Wallet) => delegate.publicKey),
                )}`,
            );

            expect(loggerDebug).toHaveBeenCalledWith(
                `Round 1 will end in ${Utils.prettyTime(secondsToNextRound * 1000)}.`,
            );
        });

        it("should log the next forger when it's time to forge", async () => {
            delegateTracker.initialize(activeDelegates);

            jest.spyOn(Crypto.Slots, "getSlotNumber").mockReturnValue(0);
            // @ts-ignore
            jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({ blocktime: 0, activeDelegates: 51 });
            await delegateTracker.handle();

            const nextToForge = activeDelegates[2];
            expect(loggerDebug).toHaveBeenCalledWith(`${nextToForge.publicKey} will forge next.`);
        });
    });
});
