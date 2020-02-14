import "jest-extended";

import { Interfaces } from "@arkecosystem/crypto";
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
    IBusinessUpdateAsset,
} from "../../../packages/core-magistrate-crypto/src/interfaces";

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
    repository: "http://www.repository.com/myorg/myrepo",
};

export const businessRegistrationAsset4: IBusinessRegistrationAsset = {
    name: "arkecosystemARK",
    website: "https://ark.io",
    repository: "http://www.repository.com/myorg/myrepo",
};

// Business update

export const businessUpdateAsset1: IBusinessUpdateAsset = {
    name: "ark",
};

export const businessUpdateAsset2: IBusinessUpdateAsset = {
    name: "ark",
    website: "https://www.ark.io",
    vat: "1234567890",
};

export const businessUpdateAsset3: IBusinessUpdateAsset = {
    name: "ark",
    website: "https://www.ark.io",
    vat: "1234567890",
    repository: "http://www.repository.com/myorg/myrepo",
};

// Bridgechain registration assets
export const bridgechainRegistrationAsset1: IBridgechainRegistrationAsset = {
    name: "arkecosystem1",
    seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: {
        "@arkecosystem/core-api": 12345,
        "@custom/api": 3333,
    },
};

export const bridgechainRegistrationAsset2: IBridgechainRegistrationAsset = {
    name: "arkecosystem2",
    seedNodes: ["131.107.0.89"],
    genesisHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    ports: { "@arkecosystem/core-api": 12345 },
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
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: { "@arkecosystem/core-api": 12345 },
};

// Bridgechain update assets
export const bridgechainUpdateAsset1: IBridgechainUpdateAsset = {
    bridgechainId: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    seedNodes: ["1.1.1.1", "2.2.2.2"],
    ports: { "@arkecosystem/core-api": 12345 },
    bridgechainRepository: "http://www.newrepository.com/neworg/newrepo",
    bridgechainAssetRepository: "http://www.newrepository.com/neworg/newassetrepo",
};

export const bridgechainUpdateAsset2: IBridgechainUpdateAsset = {
    bridgechainId: bridgechainRegistrationAsset2.genesisHash,
    seedNodes: ["1.1.1.1", "2.2.2.2"],
    bridgechainAssetRepository: "http://www.newrepository.com/neworg/newassetrepo",
};
