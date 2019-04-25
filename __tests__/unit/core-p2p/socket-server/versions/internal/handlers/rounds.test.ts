import "../../../../mocks/core-container";

import { getCurrentRound } from "../../../../../../../packages/core-p2p/src/socket-server/versions/internal";
import { delegates } from "../../../../../../utils/fixtures/testnet/delegates";

import { Crypto } from "@arkecosystem/crypto";

const timestampSlots = 104;
Crypto.Slots.getTime = jest.fn().mockReturnValue(timestampSlots);

describe("Internal handlers - rounds", () => {
    describe("getCurrentRound", () => {
        it("should return current round data", async () => {
            const round = await getCurrentRound();

            const currentForger = parseInt((timestampSlots / 8) as any) % 51;
            const nextForger = (parseInt((timestampSlots / 8) as any) + 1) % 51;

            expect(round).toEqual({
                current: 1,
                reward: 0,
                timestamp: timestampSlots,
                delegates,
                currentForger: delegates[currentForger],
                nextForger: delegates[nextForger],
                lastBlock: { height: 1, timestamp: 222 },
                canForge: parseInt((1 + 222 / 8) as any) * 8 < timestampSlots - 1,
            });
        });
    });
});
