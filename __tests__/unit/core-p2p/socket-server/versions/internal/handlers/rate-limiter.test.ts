import "../../../../mocks/core-container";

import { getRateLimitedEndpoints } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";
import { createPeerService } from "../../../../../../helpers/peers";

describe("Internal handlers - rate limiter", () => {
    describe("getRateLimitedEndpoints", () => {
        it("should return rate limited endpoints", async () => {
            const { service } = createPeerService();
            const endpoints = getRateLimitedEndpoints({ service });

            expect(endpoints).toEqual(
                expect.arrayContaining([
                    "p2p.peer.postBlock",
                    "p2p.peer.getBlocks",
                    "p2p.peer.getPeers",
                    "p2p.peer.getStatus",
                    "p2p.peer.getCommonBlocks",
                ]),
            );
            expect(endpoints).not.toContain("p2p.peer.postTransactions");
        });
    });
});
