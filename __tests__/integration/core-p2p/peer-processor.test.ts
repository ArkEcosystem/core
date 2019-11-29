import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { Managers } from "@arkecosystem/crypto";
import { createPeerService, createStubPeer } from "../../helpers/peers";
import { MockSocketManager } from "./__support__/mock-socket-server/manager";
import { eventEmitter } from "./mocks/core-container";

let socketManager: MockSocketManager;

let storage: P2P.IPeerStorage;

beforeAll(async () => {
    socketManager = new MockSocketManager();
    await socketManager.init();
});

afterAll(async () => {
    socketManager.stopServer();
});

beforeEach(() => {
    ({ storage } = createPeerService());
});

afterEach(() => socketManager.resetAllMocks());

describe("PeerProcessor", () => {
    describe("milestone change", () => {
        it("should remove peers with an invalid version", async () => {
            jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({
                p2p: {
                    minimumVersions: ["^3.0"],
                },
            });

            for (let i = 0; i < 5; i++) {
                storage.setPeer(createStubPeer({ ip: `127.0.0.${i + 1}`, port: 4009, version: "2.5.0" }));
            }

            storage.setPeer(createStubPeer({ ip: `127.0.0.30`, port: 4009, version: "3.0.0" }));

            expect(storage.getPeers()).toHaveLength(6);
            eventEmitter.emit("internal.milestone.changed");
            expect(storage.getPeers()).toHaveLength(1);
            eventEmitter.emit("internal.milestone.changed");
            expect(storage.getPeers()).toHaveLength(1);

            jest.spyOn(Managers.configManager, "getMilestone").mockReturnValue({
                p2p: {
                    minimumVersions: ["^4.0"],
                },
            });

            eventEmitter.emit("internal.milestone.changed");
            expect(storage.getPeers()).toBeEmpty();

            jest.restoreAllMocks();
        });
    });
});
