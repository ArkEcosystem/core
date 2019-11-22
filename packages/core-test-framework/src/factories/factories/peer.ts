import Chance from "chance";

import { FactoryBuilder } from "../factory-builder";

export const registerPeerFactory = (factory: FactoryBuilder): void => {
    const chance: Chance = new Chance();

    factory.set("Peer", () => {
        return {
            ip: chance.ip(),
            port: chance.port(),
            version: chance.pickone(["3.0.0", "3.0.0-next.0"]),
            latency: chance.integer({ min: 1, max: 1000 }),
        };
    });
};
