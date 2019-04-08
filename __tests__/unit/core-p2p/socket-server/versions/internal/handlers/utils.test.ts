import "../../../../mocks/core-container";
import { eventEmitter } from "../../../../mocks/event-emitter";

import {
    emitEvent,
    getUsernames,
} from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal/handlers/utils";
import { createPeerService } from "../../../../../../helpers/peers";
import { delegates } from "../../../../../../utils/fixtures/testnet/delegates";

describe("Internal handlers - utils", () => {
    describe("getUsernames", () => {
        it("should call blockchain forceWakeup", async () => {
            const expectedData = {};
            delegates.forEach(delegate => {
                expectedData[delegate.publicKey] = "coolUsername";
            });

            const usernames = await getUsernames();
            expect(usernames).toEqual({
                data: expectedData,
            });
        });
    });

    describe("emitEvent", () => {
        it("should emit the event provided", () => {
            const req = {
                data: {
                    event: "newEvent",
                    body: { thing: "stuff" },
                },
            };

            emitEvent(createPeerService().service, req);

            expect(eventEmitter.emit).toHaveBeenCalledWith(req.data.event, req.data.body);
        });
    });
});
