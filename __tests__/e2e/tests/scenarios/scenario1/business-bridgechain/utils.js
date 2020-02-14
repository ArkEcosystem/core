// new wallet to be used for business registration
const wallets = {
    businessRegistration: {
        passphrase: "dinosaur life rocket stamp doctor fossil author supreme draft plug world canoe",
        publicKey: "029d1f7631d5e9c8d0e7c26b8f2e522c2d9f832a04252cd2beff054692d34d942b",
        address: "AH3pVCGrLaLNoR2Dwn3PvYgik5jm1tLQZ8"
      }
};

const businessRegistrationAsset = {
    name: "bizzz",
    website: "http://www.biz.com",
};

const businessUpdateAsset = {
    businessId: wallets.businessRegistration.publicKey,
    name: "bizupdated",
    website: "http://www.bizupdated.com",
};

const businessResignationAsset = {
    businessId: wallets.businessRegistration.publicKey,
};

const bridgechainRegistrationAsset = {
    name: "arkecosystem1",
    seedNodes: [
        "74.125.224.71",
        "74.125.224.72",
        "64.233.173.193",
        "2001:4860:4860::8888",
        "2001:4860:4860::8844",
    ],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: { "@arkecosystem/core-api": 12345, "custom/api": 3456 },
};

const bridgechainUpdateAsset = {
    bridgechainId: bridgechainRegistrationAsset.genesisHash,
    seedNodes: [
        "75.125.224.71",
    ],
    ports: { "@arkecosystem/core-api": 54321, "custom/other-api": 9876 },
    bridgechainRepository: "http://www.newrepository.com/neworg/newrepo",
    bridgechainAssetRepository: "http://www.newrepository.com/neworg/newassetrepo",
};

const bridgechainResignationAsset = {
    bridgechainId: bridgechainRegistrationAsset.genesisHash,
};

module.exports = {
    wallets,
    businessRegistrationAsset,
    businessUpdateAsset,
    businessResignationAsset,
    bridgechainRegistrationAsset,
    bridgechainUpdateAsset,
    bridgechainResignationAsset
};
