import { DelegateFactory } from "@arkecosystem/core-forger";
import { Crypto, Managers } from "@arkecosystem/crypto";

import secrets from "../../internal/secrets.json";
import { FactoryBuilder } from "../factory-builder";

export const registerBlockFactory = (factory: FactoryBuilder): void => {
    factory.set("Block", ({ options }) => {
        const previousBlock = Managers.configManager.get("genesisBlock");

        const { blocktime, reward } = Managers.configManager.getMilestone(previousBlock.height);

        return DelegateFactory.fromBIP39(options.passphrase || secrets[0]).forge(options.transactions || [], {
            previousBlock,
            timestamp: Crypto.Slots.getSlotNumber(Crypto.Slots.getTime()) * options.blocktime || blocktime,
            reward: options.reward || reward,
        })!;
    });
};
