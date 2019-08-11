import "jest-extended";

import { Interfaces } from "@arkecosystem/crypto";
import { IBridgechainRegistrationAsset, IBusinessRegistrationAsset } from "../../src/interfaces";

export const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

// Business registration assets

export const businessRegistrationAsset1: IBusinessRegistrationAsset = {
    name: "google",
    website: "www.google.com",
};

// Bridgechain registration assets
export const bridgechainRegistrationAsset1: IBridgechainRegistrationAsset = {
    name: "google",
    seedNodes: [
        "1.2.3.4",
        "127.0.0.1",
        "192.168.1.0",
        "74.125.224.72",
        "64.233.173.193",
        "2001:4860:4860::8888",
        "2001:4860:4860::8844",
    ],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    githubRepository: "www.github.com/google/crypto",
};

export const bridgechainRegistrationAsset2: IBridgechainRegistrationAsset = {
    name: "microsoft",
    seedNodes: ["1.2.3.4", "127.0.0.1", "192.168.1.0", "131.107.0.89"],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    githubRepository: "www.github.com/microsoft/crypto",
};
