import { Delegate } from "@arkecosystem/core-forger";
import { Crypto, Managers } from "@arkecosystem/crypto";

import { FactoryBuilder } from "../factory-builder";

import secrets from "../../internal/secrets.json";

export const registerBlockFactory = (factory: FactoryBuilder): void => {
    factory.set("Block", ({ options }) => {
        const previousBlock = Managers.configManager.get("genesisBlock");

        const { blocktime, reward } = Managers.configManager.getMilestone(previousBlock.height);

        // todo: support transactions via factory calls
        const newBlock = new Delegate(
            options.passphrase || secrets[0],
            Managers.configManager.get("network.pubKeyHash"),
        ).forge([], {
            previousBlock,
            timestamp: Crypto.Slots.getSlotNumber(Crypto.Slots.getTime()) * options.blocktime || blocktime,
            reward: options.reward || reward,
        })!;

        return { ...newBlock.toJson(), ...{ serialized: newBlock.serialized } };
    });
};
