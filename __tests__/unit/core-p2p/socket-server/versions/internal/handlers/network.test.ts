import { makePeerService } from "../../../../../../../packages/core-p2p/src/plugin";
import { getNetworkState } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal/handlers/network";
import "../../../../mocks/core-container";

describe("Internal handlers - network", () => {
    describe("getNetworkState", () => {
        it("should call monitor getNetworkState", () => {
            const service = makePeerService();

            service.getMonitor().getNetworkState = jest.fn();

            getNetworkState(service);

            expect(service.getMonitor().getNetworkState).toHaveBeenCalledTimes(1);
        });
    });
});
