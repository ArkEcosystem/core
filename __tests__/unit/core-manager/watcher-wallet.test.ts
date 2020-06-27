import "jest-extended";

import { Services } from "@arkecosystem/core-kernel";
import { WatcherWallet } from "@arkecosystem/core-manager/src/watcher-wallet";
import { Utils } from "@arkecosystem/crypto";
import { getWalletAttributeSet } from "@packages/core-test-framework/src/internal/wallet-attributes";

let wallet: WatcherWallet;
const mockEventDispatcher = {
    dispatchSync: jest.fn(),
};

beforeEach(() => {
    const attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());

    wallet = new WatcherWallet(mockEventDispatcher as any, "123", attributeMap);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("WatcherWallet", () => {
    describe("Original", () => {
        it("should emit on property set", async () => {
            wallet.nonce = Utils.BigNumber.make("3");

            expect(mockEventDispatcher.dispatchSync).toHaveBeenCalledTimes(1);
        });

        it("should emit on setAttribute", async () => {
            wallet.setAttribute("delegate.username", "dummy");

            expect(mockEventDispatcher.dispatchSync).toHaveBeenCalledTimes(1);
        });

        it("should emit on forgetAttribute", async () => {
            wallet.setAttribute("delegate.username", "dummy");
            wallet.forgetAttribute("delegate.username");

            expect(mockEventDispatcher.dispatchSync).toHaveBeenCalledTimes(2);
        });

        it("should clone", async () => {
            const clone = wallet.clone();

            expect(clone).toEqual(wallet);
        });
    });

    describe("Clone", () => {
        let clone: WatcherWallet;

        beforeEach(() => {
            clone = wallet.clone();
            jest.clearAllMocks();
        });

        it("should emit on property set", async () => {
            clone.nonce = Utils.BigNumber.make("3");

            expect(mockEventDispatcher.dispatchSync).toHaveBeenCalledTimes(1);
        });

        it("should emit on setAttribute", async () => {
            clone.setAttribute("delegate.username", "dummy");

            expect(mockEventDispatcher.dispatchSync).toHaveBeenCalledTimes(1);
        });

        it("should emit on forgetAttribute", async () => {
            clone.setAttribute("delegate.username", "dummy");
            clone.forgetAttribute("delegate.username");

            expect(mockEventDispatcher.dispatchSync).toHaveBeenCalledTimes(2);
        });

        it("should clone", async () => {
            const anotherClone = clone.clone();

            expect(anotherClone).toEqual(wallet);
        });
    });
});
