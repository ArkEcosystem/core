import "../../../../mocks/core-container";

import { getNetworkState } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";
import { createPeerService } from "../../../../../../helpers/peers";

describe("Internal handlers - network", () => {
    describe("getNetworkState", () => {
        it("should call monitor getNetworkState", () => {
            const { service, monitor } = createPeerService();

            monitor.getNetworkState = jest.fn();

            getNetworkState({ service });

            expect(monitor.getNetworkState).toHaveBeenCalledTimes(1);
        });
    });
});
