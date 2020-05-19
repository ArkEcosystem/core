import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { factory } from "@packages/core-test-framework/src/factories/helpers";

describe("Helpers", () => {
    it("should register all factories using default crypto", async () => {
        expect(factory("Block")).toBeDefined();
        expect(factory("Identity")).toBeDefined();
        expect(factory("Peer")).toBeDefined();
        expect(factory("Round")).toBeDefined();
        expect(factory("Transfer")).toBeDefined();
        expect(factory("SecondSignature")).toBeDefined();
        expect(factory("DelegateRegistration")).toBeDefined();
        expect(factory("DelegateResignation")).toBeDefined();
        expect(factory("Vote")).toBeDefined();
        expect(factory("Unvote")).toBeDefined();
        expect(factory("MultiSignature")).toBeDefined();
        expect(factory("Ipfs")).toBeDefined();
        expect(factory("HtlcLock")).toBeDefined();
        expect(factory("HtlcClaim")).toBeDefined();
        expect(factory("HtlcRefund")).toBeDefined();
        expect(factory("MultiPayment")).toBeDefined();
        expect(factory("BusinessRegistration")).toBeDefined();
        expect(factory("BusinessResignation")).toBeDefined();
        expect(factory("BusinessUpdate")).toBeDefined();
        expect(factory("BridgechainRegistration")).toBeDefined();
        expect(factory("BridgechainResignation")).toBeDefined();
        expect(factory("BridgechainUpdate")).toBeDefined();
        expect(factory("Wallet")).toBeDefined();
    });
    it("should register all factories using custom crypto", async () => {
        const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("mainnet"));

        expect(factory("Block", crypto)).toBeDefined();
        expect(factory("Identity", crypto)).toBeDefined();
        expect(factory("Peer", crypto)).toBeDefined();
        expect(factory("Round", crypto)).toBeDefined();
        expect(factory("Transfer", crypto)).toBeDefined();
        expect(factory("SecondSignature", crypto)).toBeDefined();
        expect(factory("DelegateRegistration", crypto)).toBeDefined();
        expect(factory("DelegateResignation", crypto)).toBeDefined();
        expect(factory("Vote", crypto)).toBeDefined();
        expect(factory("Unvote", crypto)).toBeDefined();
        expect(factory("MultiSignature", crypto)).toBeDefined();
        expect(factory("Ipfs", crypto)).toBeDefined();
        expect(factory("HtlcLock", crypto)).toBeDefined();
        expect(factory("HtlcClaim", crypto)).toBeDefined();
        expect(factory("HtlcRefund", crypto)).toBeDefined();
        expect(factory("MultiPayment", crypto)).toBeDefined();
        expect(factory("BusinessRegistration", crypto)).toBeDefined();
        expect(factory("BusinessResignation", crypto)).toBeDefined();
        expect(factory("BusinessUpdate", crypto)).toBeDefined();
        expect(factory("BridgechainRegistration", crypto)).toBeDefined();
        expect(factory("BridgechainResignation", crypto)).toBeDefined();
        expect(factory("BridgechainUpdate", crypto)).toBeDefined();
        expect(factory("Wallet", crypto)).toBeDefined();
    });
});
