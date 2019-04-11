import "../../../../mocks/core-container";
import { eventEmitter } from "../../../../mocks/event-emitter";

import { emitEvent } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";
import { createPeerService } from "../../../../../../helpers/peers";

describe("Internal handlers - utils", () => {
    describe("emitEvent", () => {
        it("should emit the event provided", () => {
            const req = {
                data: {
                    event: "newEvent",
                    body: { thing: "stuff" },
                },
            };

            emitEvent({ service: createPeerService().service, req });

            expect(eventEmitter.emit).toHaveBeenCalledWith(req.data.event, req.data.body);
        });
    });
});
