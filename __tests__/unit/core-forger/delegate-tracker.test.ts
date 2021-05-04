import "jest-extended";

import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { Utils } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { Crypto, Managers } from "@packages/crypto";

import { calculateActiveDelegates } from "./__utils__/calculate-active-delegates";
import { dummy } from "./__utils__/create-block-with-transactions";
import { mockLastBlock, setup } from "./setup";

let delegateTracker: DelegateTracker;
let loggerDebug: jest.SpyInstance;
let loggerWarning: jest.SpyInstance;
let activeDelegates;

beforeEach(async () => {
    activeDelegates = calculateActiveDelegates();
    const initialEnv = await setup(activeDelegates);
    delegateTracker = initialEnv.sandbox.app.resolve<DelegateTracker>(DelegateTracker);
    loggerDebug = initialEnv.spies.logger.debug;
    loggerWarning = initialEnv.spies.logger.warning;
});

beforeEach(() => {
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
        it("should handle and compute next forgers", async () => {
            delegateTracker.initialize(activeDelegates);
            await expect(delegateTracker.handle()).toResolve();
        });

        it("should log the next forgers and time to next round", async () => {
            delegateTracker.initialize([activeDelegates[0]]);

            const slotSpy = jest.spyOn(Crypto.Slots, "getSlotNumber");
            slotSpy.mockReturnValue(0);
            await delegateTracker.handle();

            const height = mockLastBlock.data.height;
            const delegatesCount = Managers.configManager.getMilestone(height).activeDelegates;
            const blockTime: number = Managers.configManager.getMilestone(height).blocktime;

            const secondsToNextRound = (delegatesCount - (height % delegatesCount)) * blockTime;

            expect(loggerDebug).toHaveBeenCalledWith(
                `Next Forgers: ${JSON.stringify(
                    activeDelegates.slice(2, 7).map((delegate: Wallet) => delegate.getPublicKey()),
                )}`,
            );

            expect(loggerDebug).toHaveBeenCalledWith(
                `Round 1 will end in ${Utils.prettyTime(secondsToNextRound * 1000)}.`,
            );
        });

        it("should log the next forger when it's time to forge", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getSlotNumber");
            slotSpy.mockReturnValue(0);
            const mockMileStoneData = {
                blocktime: 0,
                activeDelegates: 51,
            };
            const milestoneSpy = jest.spyOn(Managers.configManager, "getMilestone");
            milestoneSpy.mockReturnValue(mockMileStoneData);

            delegateTracker.initialize(activeDelegates);
            await delegateTracker.handle();

            milestoneSpy.mockRestore();
            milestoneSpy.mockClear();
            milestoneSpy.mockReset();

            const nextToForge = activeDelegates[2];
            expect(loggerDebug).toHaveBeenCalledWith(`${nextToForge.publicKey} will forge next.`);
        });

        it("should log the next forger and the time when it will forge", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getSlotNumber");
            slotSpy.mockReturnValue(0);

            const blockTime = 8;
            delegateTracker.initialize(activeDelegates);
            await delegateTracker.handle();

            let secondsToForge = blockTime;

            for (let i = 0; i < activeDelegates.length; i++) {
                const nextToForge = activeDelegates[i];
                // mockLastBlock has height of 3
                if (i === 2) {
                    expect(loggerDebug).toHaveBeenCalledWith(`${nextToForge.publicKey} will forge next.`);
                } else if (i < 2) {
                    expect(loggerDebug).toHaveBeenNthCalledWith(i + 2, `${nextToForge.publicKey} has already forged.`);
                } else {
                    expect(loggerDebug).toHaveBeenNthCalledWith(
                        i + 2,
                        `${nextToForge.publicKey} will forge in ${Utils.prettyTime(secondsToForge * 1000)}.`,
                    );
                    secondsToForge += blockTime;
                }
            }
        });

        it("should log warning when there are less active delegates than the required delegate count", async () => {
            const mockMileStoneData = {
                blocktime: 2,
                activeDelegates: 80,
            };
            const milestoneSpy = jest.spyOn(Managers.configManager, "getMilestone");
            milestoneSpy.mockReturnValue(mockMileStoneData);

            delegateTracker.initialize(activeDelegates);
            await delegateTracker.handle();

            expect(loggerWarning).toHaveBeenCalledWith(
                `Tracker only has ${activeDelegates.length} active delegates from a required ${mockMileStoneData.activeDelegates}`,
            );
        });
    });
});
