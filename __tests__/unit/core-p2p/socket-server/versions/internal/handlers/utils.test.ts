import "../../../../mocks/core-container";
import { eventEmitter } from "../../../../mocks/event-emitter";

import { emitEvent } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";

describe("Internal handlers - utils", () => {
    describe("emitEvent", () => {
        it("should emit the event provided", () => {
            const req = {
                data: {
                    event: "newEvent",
                    body: { thing: "stuff" },
                },
            };

            emitEvent({ req });

            expect(eventEmitter.emit).toHaveBeenCalledWith(req.data.event, req.data.body);
        });
    });
});
