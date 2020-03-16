import "jest-extended";

import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { Wallet } from "@packages/core-state/src/wallets";
import { Identities } from "@packages/crypto";

import { dummy } from "./__utils__/create-block-with-transactions";
import { setup } from "./setup";

let delegateTracker: DelegateTracker;
let attributeMap;
const activeDelegates = [];
let loggerDebug;

beforeEach(async () => {
    for (let i = 0; i < 10; i++) {
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
        it("should call database service to get the active delegates ", async () => {
            const delegate = new BIP39(dummy.plainPassphrase);

            //@ts-ignore
            delegateTracker.initialize([delegate]);
            delegateTracker.handle();

            expect(loggerDebug).toHaveBeenCalledWith(
                `Next Forgers: ${JSON.stringify(
                    activeDelegates.slice(0, 5).map((delegate: Wallet) => delegate.publicKey),
                )}`,
            );
        });
    });
});
