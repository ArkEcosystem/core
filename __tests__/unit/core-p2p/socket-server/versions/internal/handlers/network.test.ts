import "../../../../mocks/core-container";

import { monitor } from "../../../../../../../packages/core-p2p/src/monitor";
jest.mock("../../../../../../../packages/core-p2p/src/monitor");

import { getNetworkState } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal/handlers/network";

describe("Internal handlers - network", () => {
    describe("getNetworkState", () => {
        it("should call monitor getNetworkState", () => {
            getNetworkState();
            expect(monitor.getNetworkState).toHaveBeenCalledTimes(1);
        });
    });
});
