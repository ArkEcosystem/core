import "../../../../mocks/core-container";

import { blockchain } from "../../../../mocks/blockchain";

import { Blocks } from "@arkecosystem/crypto";
import { storeBlock } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";
import { genesisBlock } from "../../../../../../utils/config/unitnet/genesisBlock";

describe("Internal handlers - blocks", () => {
    describe("storeBlock", () => {
        it("should call blockchain forceWakeup", () => {
            const req = {
                headers: { remoteAddress: "0.0.0.0" },
                data: {
                    block: Blocks.Block.fromData(genesisBlock).toJson(),
                },
            };

            storeBlock({ req });

            expect(blockchain.handleIncomingBlock).toHaveBeenCalledWith(req.data.block);
        });
    });
});
