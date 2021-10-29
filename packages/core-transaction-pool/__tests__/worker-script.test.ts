describe("worker-script.ts", () => {
    it("should not crash", () => {
        const check = () => require("../../../packages/core-transaction-pool/src/worker-script");
        expect(check).not.toThrow();
    });
});
