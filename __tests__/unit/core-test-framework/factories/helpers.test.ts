import "jest-extended";

import { factory } from "@packages/core-test-framework/src/factories/helpers";

describe("Helpers", () => {
    it("should register all factories", async () => {
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
});
