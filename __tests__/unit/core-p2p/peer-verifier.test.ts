import "./mocks/core-container";

import nock from "nock";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { PeerVerifier } from "../../../packages/core-p2p/src/peer-verifier";
import { blocks2to100 as blocks2to100Json } from "../../utils/fixtures";
import { genesisBlock } from "../../utils/fixtures/unitnet/block-model";

let peerMock: Peer;

beforeEach(() => {
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers);

    nock.cleanAll();
});

describe("Peer Verifier", () => {
    describe("checkState", () => {
        it("identical chains", async () => {
            const peerVerifier = new PeerVerifier(peerMock);
            const state = { header: { height: 1, id: genesisBlock.data.id } };
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeObject();
            expect(result.forked).toBe(false);
        });

        it("different chains, including the genesis block", async () => {
            nock(peerMock.url)
                .get("/peer/blocks/common")
                .query({ ids: genesisBlock.data.id })
                .reply(
                    200,
                    {
                        common: null,
                        success: true,
                    },
                    peerMock.headers,
                );

            const peerVerifier = new PeerVerifier(peerMock);
            const state = { header: { height: 1, id: "123" } };
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeNull();
        });

        it("bogus replies for common block", async () => {
            const commonBlockReplies = [
                "not an object",
                { id: { a: "id is not a string" } },
                { id: "id is string", height: "but height is not a number" },
                { id: "id is string, but none of the queried ids", height: 1 },
                { id: `${genesisBlock.data.id}`, height: 42 },
            ];

            for (const commonBlockReply of commonBlockReplies) {
                nock(peerMock.url)
                    .get("/peer/blocks/common")
                    .query({ ids: genesisBlock.data.id })
                    .reply(
                        200,
                        {
                            common: commonBlockReply,
                            success: true,
                        },
                        peerMock.headers,
                    );

                const peerVerifier = new PeerVerifier(peerMock);
                const state = { header: { height: 1, id: "123" } };
                const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
                expect(result).toBeNull();
            }
        });

        it("higher than our chain (invalid)", async () => {
            nock(peerMock.url)
                .get("/peer/blocks/common")
                .query({ ids: genesisBlock.data.id })
                .reply(
                    200,
                    {
                        common: { id: `${genesisBlock.data.id}`, height: 1 },
                        success: true,
                    },
                    peerMock.headers,
                );

            const overrides = [
                // Altered payload (timestamp)
                { timestamp: 0 },
                // Wrong/non-matching signature
                { blockSignature: blocks2to100Json[1].blockSignature },
                // Wrong/non-matching signer
                { generatorPublicKey: blocks2to100Json[1].generatorPublicKey },
            ];

            for (const override of overrides) {
                const block2 = Object.assign({}, blocks2to100Json[0], override);

                nock(peerMock.url)
                    .get("/peer/blocks")
                    .reply(
                        200,
                        {
                            blocks: [block2],
                        },
                        peerMock.headers,
                    );

                const peerVerifier = new PeerVerifier(peerMock);
                const state = { header: { height: 2, id: block2.id } };
                const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
                expect(result).toBeNull();
            }
        });

        it("higher than our chain (legit)", async () => {
            nock(peerMock.url)
                .get("/peer/blocks/common")
                .query({ ids: `${genesisBlock.data.id},` })
                .reply(
                    200,
                    {
                        common: { id: genesisBlock.data.id, height: 1 },
                        success: true,
                    },
                    peerMock.headers,
                );

            nock(peerMock.url)
                .get("/peer/blocks")
                .query({ lastBlockHeight: 1 })
                .reply(
                    200,
                    {
                        blocks: [blocks2to100Json[0]],
                    },
                    peerMock.headers,
                );

            const peerVerifier = new PeerVerifier(peerMock);
            const state = { header: { height: 2, id: blocks2to100Json[0].id } };
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeObject();
            expect(result.forked).toBe(false);
        });
    });
});
