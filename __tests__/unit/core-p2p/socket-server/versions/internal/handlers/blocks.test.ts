import { blockchain } from "../../../../mocks/blockchain";
import "../../../../mocks/core-container";

import { storeBlock } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal/handlers/blocks";
import { createPeerService } from "../../../../../../helpers/peers";
import genesisBlockJSON from "../../../../../../utils/config/unitnet/genesisBlock.json";

describe("Internal handlers - blocks", () => {
    describe("storeBlock", () => {
        it("should call blockchain forceWakeup", () => {
            const req = {
                headers: { remoteAddress: "0.0.0.0" },
                data: {
                    block: genesisBlockJSON,
                },
            };

            storeBlock(createPeerService().service, req);

            expect(blockchain.handleIncomingBlock).toHaveBeenCalledWith(req.data.block);
        });
    });
});
