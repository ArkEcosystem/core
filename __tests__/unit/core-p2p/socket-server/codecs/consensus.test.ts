import { createBlockProposal } from "@packages/core-p2p/src/socket-server/codecs/consensus";

describe("Consensus codec tests", () => {
    describe("createBlockProposal ser/deser", () => {
        it("should give back the same data after ser and deser", () => {
            const data = {
                hash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
                height: 1,
                generatorPublicKey: "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
                signature:
                    "3045022100ec71805b816b2c09ae7689bef633d3a59a24a3a7516e55255abba9ad69ba15650220583550dd2bb2d76ed2519c8395a41c2e0fbbb287ff02d73452365b41e19889af",
                timestamp: 1,
                payload: {},
                headers: { version: "3.0.0-next.18" },
            };

            const serDeser = createBlockProposal.request.deserialize(createBlockProposal.request.serialize(data));

            expect(serDeser).toEqual(data);
        });
    });
});
