import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
    IBusinessUpdateAsset,
} from "@packages/core-magistrate-crypto/src/interfaces";

export const businessRegistrationAsset: IBusinessRegistrationAsset = {
    name: "DummyBusiness",
    website: "https://www.dummy.example",
    vat: "EX1234567890",
    repository: "https://www.dummy.example/repo",
};

export const bridgechainRegistrationAsset: IBridgechainRegistrationAsset = {
    name: "arkecosystem1",
    seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: { "@arkecosystem/core-api": 12345 },
};

export const businessUpdateAsset: IBusinessUpdateAsset = {
    name: "DummyBusinessUpdated",
    website: "https://www.dummy.example.updated",
    vat: "UEX1234567890",
    repository: "https://www.dummy.example/repo/updated",
};

export const bridgechainUpdateAsset: IBridgechainUpdateAsset = {
    bridgechainId: bridgechainRegistrationAsset.genesisHash,
    seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: { "@arkecosystem/core-api": 12345 },
};
