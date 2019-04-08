import { blockchain } from "../../../../mocks/blockchain";
import "../../../../mocks/core-container";

import { syncBlockchain } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal/handlers/blockchain";

describe("Internal handlers - blockchain", () => {
    describe("syncBlockchain", () => {
        it("should call blockchain forceWakeup", () => {
            syncBlockchain();

            expect(blockchain.forceWakeup).toHaveBeenCalledTimes(1);
        });
    });
});
