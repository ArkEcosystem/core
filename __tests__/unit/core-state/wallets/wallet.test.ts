import "jest-extended";

import { Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { getWalletAttributeSet } from "@packages/core-test-framework/src/internal/wallet-attributes";

import { setUp, Setup } from "../setup";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

let setup: Setup;

beforeAll(async () => {
    setup = await setUp();
});

describe("Models - Wallet", () => {
    let attributeMap;

    beforeEach(() => {
        attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
    });

    it("returns the address", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);
        expect(wallet.address).toBe(address);
    });

    it("should get, set and forget custom attributes", () => {
        const customAttributeSet = getWalletAttributeSet();
        customAttributeSet.set("customAttribute");
        const custromAttributeMap = new Services.Attributes.AttributeMap(customAttributeSet);

        const address = "Abcde";
        const wallet = new Wallet(address, custromAttributeMap);
        const testAttribute = { test: true };
        wallet.setAttribute("customAttribute", testAttribute);
        expect(wallet.hasAttribute("customAttribute")).toBe(true);
        expect(wallet.getAttribute("customAttribute")).toBe(testAttribute);

        wallet.forgetAttribute("customAttribute");

        expect(wallet.hasAttribute("customAttribute")).toBe(false);

        customAttributeSet.forget("customAttribute");

        expect(() => wallet.hasAttribute("customAttribute")).toThrow();
        expect(() => wallet.getAttribute("customAttribute")).toThrow();
    });

    it("should get all attributes", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        wallet.setAttribute("delegate", {});
        wallet.setAttribute("vote", {});

        expect(wallet.getAttributes()).toEqual({ delegate: {}, vote: {} });
    });

    it("should return whether wallet is delegate", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        expect(wallet.isDelegate()).toBe(false);
        wallet.setAttribute("delegate", {});
        expect(wallet.isDelegate()).toBe(true);
    });

    it("should return whether wallet has voted", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        expect(wallet.hasVoted()).toBe(false);
        wallet.setAttribute("vote", {});
        expect(wallet.hasVoted()).toBe(true);
    });

    it("should return whether the wallet has a second signature", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        expect(wallet.hasSecondSignature()).toBe(false);
        wallet.setAttribute("secondPublicKey", {});
        expect(wallet.hasSecondSignature()).toBe(true);
    });

    it("should return whether the wallet has multisignature", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        expect(wallet.hasMultiSignature()).toBe(false);
        wallet.setAttribute("multiSignature", {});
        expect(wallet.hasMultiSignature()).toBe(true);
    });

    it("should be cloneable", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        expect(wallet.clone()).toEqual(wallet);
    });
});

describe("Original", () => {
    let wallet: Wallet;

    beforeEach(() => {
        const attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
        const events = setup.sandbox.app.get<Contracts.Kernel.EventDispatcher>(
            Container.Identifiers.EventDispatcherService,
        );
        wallet = new Wallet("Abcde", attributeMap, events);

        jest.resetAllMocks();
    });

    it("should emit on property set", async () => {
        wallet.balance = Utils.BigNumber.make("100");

        expect(setup.spies.dispatchSyncSpy).toHaveBeenCalledTimes(1);
    });

    it("should emit on setAttribute", async () => {
        wallet.setAttribute("delegate.username", "dummy");

        expect(setup.spies.dispatchSyncSpy).toHaveBeenCalledTimes(1);
    });

    it("should emit on forgetAttribute", async () => {
        wallet.setAttribute("delegate.username", "dummy");
        wallet.forgetAttribute("delegate.username");

        expect(setup.spies.dispatchSyncSpy).toHaveBeenCalledTimes(2);
    });

    it("should clone", async () => {
        wallet.setAttribute("delegate.username", "dummy");
        const clone = wallet.clone();

        expect(clone.address).toEqual("Abcde");
        expect(clone.getAttribute("delegate.username")).toEqual("dummy");
    });
});

describe("Clone", () => {
    let clone;

    beforeEach(() => {
        const attributeMap = new Services.Attributes.AttributeMap(getWalletAttributeSet());
        const events = setup.sandbox.app.get<Contracts.Kernel.EventDispatcher>(
            Container.Identifiers.EventDispatcherService,
        );
        const wallet = new Wallet("Abcde", attributeMap, events);
        clone = wallet.clone();

        jest.resetAllMocks();
    });

    it("should emit on property set", async () => {
        clone.nonce = Utils.BigNumber.make("3");

        expect(setup.spies.dispatchSyncSpy).not.toHaveBeenCalled();
    });

    it("should emit on setAttribute", async () => {
        clone.setAttribute("delegate.username", "dummy");

        expect(setup.spies.dispatchSyncSpy).not.toHaveBeenCalled();
    });

    it("should emit on forgetAttribute", async () => {
        clone.setAttribute("delegate.username", "dummy");
        clone.forgetAttribute("delegate.username");

        expect(setup.spies.dispatchSyncSpy).not.toHaveBeenCalled();
    });
});
