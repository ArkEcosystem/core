import "jest-extended";

import { Sandbox } from "@packages/core-test-framework/src";
import { attributes } from '@arkecosystem/core-test-framework/src/internal/wallet-attributes';
import { Container, Services } from "@arkecosystem/core-kernel";

import { Wallet } from "@arkecosystem/core-state/src/wallets";
import { AttributeMap } from "@arkecosystem/core-kernel/dist/services/attributes";

let sandbox: Sandbox;

let attributeMap: AttributeMap;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();
});

beforeEach(() => {
    attributeMap = new Services.Attributes.AttributeMap(attributes);
});

describe("Models - Wallet", () => {
    it("returns the address", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);
        expect(wallet.address).toBe(address);
    });

    it("should get, set and forget custom attributes", () => {
        attributes.set("customAttribute");

        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);
        const testAttribute = { test: true };
        wallet.setAttribute("customAttribute", testAttribute);
        expect(wallet.hasAttribute("customAttribute")).toBe(true);
        expect(wallet.getAttribute("customAttribute")).toBe(testAttribute);

        wallet.forgetAttribute("customAttribute");

        expect(wallet.hasAttribute("customAttribute")).toBe(false);

        attributes.forget("customAttribute");

        expect(() => wallet.hasAttribute("customAttribute")).toThrow();
        expect(() => wallet.getAttribute("customAttribute")).toThrow();
    });

    it("should get all attributes", () => {
        const address = "Abcde";
        const wallet = new Wallet(address, attributeMap);

        wallet.setAttribute("delegate", {});
        wallet.setAttribute("vote", {});

        expect(wallet.getAttributes()).toEqual({delegate: {}, vote: {}});
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