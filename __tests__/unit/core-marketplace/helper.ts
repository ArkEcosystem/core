import "jest-extended";

import { Interfaces } from "@arkecosystem/crypto";
import {
    IBridgechainRegistrationAsset,
    IBusinessRegistrationAsset,
    IBusinessUpdateAsset,
} from "../../../packages/core-marketplace/src/interfaces";

export const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};

// Business registration assets

export const businessRegistrationAsset1: IBusinessRegistrationAsset = {
    name: "arkecosystem",
    website: "https://ark.io",
};

export const businessRegistrationAsset2: IBusinessRegistrationAsset = {
    name: "arkecosystem",
    website: "https://ark.io",
    vat: "123456789",
};

export const businessRegistrationAsset3: IBusinessRegistrationAsset = {
    name: "arkecosystem",
    website: "https://ark.io",
    vat: "123456789",
    repository: "arkecosystem.com/repo",
};

export const businessRegistrationAsset4: IBusinessRegistrationAsset = {
    name: "arkecosystemARK",
    website: "https://ark.io",
    repository: "arkecosystem.com/repo",
};

// Business update

export const businessUpdateAsset1: IBusinessUpdateAsset = {
    name: "ark",
};

export const businessUpdateAsset2: IBusinessUpdateAsset = {
    name: "ark",
    website: "www.ark.io",
    vat: "1234567890",
};

export const businessUpdateAsset3: IBusinessUpdateAsset = {
    name: "ark",
    website: "www.ark.io",
    vat: "1234567890",
    repository: "arkecosystem.com/repo",
};

// Bridgechain registration assets
export const bridgechainRegistrationAsset1: IBridgechainRegistrationAsset = {
    name: "arkecosystem1",
    seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    bridgechainRepository: "arkecosystem1.com/repo",
};

export const bridgechainRegistrationAsset2: IBridgechainRegistrationAsset = {
    name: "arkecosystem2",
    seedNodes: ["131.107.0.89"],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    bridgechainRepository: "arkecosystem2.com/repo",
};

export const bridgechainRegistrationAssetBad: IBridgechainRegistrationAsset = {
    name: "arkecosystem1",
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
    bridgechainRepository: "arkecosystem1.com/repo",
};
