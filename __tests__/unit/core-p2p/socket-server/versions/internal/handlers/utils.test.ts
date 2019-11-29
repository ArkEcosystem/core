import "../../../../mocks/core-container";

import { app } from "@arkecosystem/core-container";
import { EventEmitter } from "@arkecosystem/core-interfaces";
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

            const emit = jest.spyOn(app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter"), "emit");

            emitEvent({ req });

            expect(emit).toHaveBeenCalledWith(req.data.event, req.data.body);

            emit.mockRestore();
        });
    });
});
