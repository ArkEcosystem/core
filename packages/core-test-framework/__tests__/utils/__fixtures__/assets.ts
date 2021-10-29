import { EntityAction, EntityType } from "@packages/core-magistrate-crypto/src/enums";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { HtlcLockExpirationType } from "@packages/crypto/src/enums";

export const paginationResponseMeta = {
    count: 100,
    pageCount: 39697,
    totalCount: 3969602,
    next: "/transactions?transform=true&page=2&limit=100",
    previous: null,
    self: "/transactions?transform=true&page=1&limit=100",
    first: "/transactions?transform=true&page=1&limit=100",
    last: "/transactions?transform=true&page=39697&limit=100",
};

export const transactionResponse = {
    id: "e875dc95e9e404ba7ba93dd92f6c9190bc87d244fce8db3046d64705ce4680f9",
    blockId: "8d31d0fcf9821186327a5d9aeb7d3b59371671b61e5ec2ecf95febc89eaf4b34",
    version: 2,
    type: 2,
    typeGroup: 1,
    amount: "0",
    fee: "2500000000",
    sender: "DPTbJqyvrPgBmhs6UFqBwFdyx6jvorxHNL",
    senderPublicKey: "027ab77a71c903893c6264f0997455534c8a9dfd4608b3bc59d3fb6366f5475b0b",
    recipient: "DPTbJqyvrPgBmhs6UFqBwFdyx6jvorxHNL",
    signature:
        "32cd7d0bc8d1ddd13ff485aa7e07c8b5f5608920be7b995fa1ed9a58ce76671bc70cc3560cb236eddb04f2b8039d70e508c6f0d0df5ddbb9f3a7c57d40ce117f",
    asset: {
        delegate: {
            username: "test123456",
        },
    },
    confirmations: 119869,
    timestamp: {
        epoch: 93911584,
        unix: 1584012784,
        human: "2020-03-12T11:33:04.000Z",
    },
    nonce: "1",
};

export const blockResponse = {
    id: "cba1860a42ae78b8454fb73c5a5270e100246fb0097078d341152783e7f350cd",
    version: 0,
    height: 11712284,
    previous: "39f0f778d58c16b8a4deb259dda2ac0a91b08fa9ce5d7b037188125bb0a349c9",
    forged: {
        reward: "200000000",
        fee: "0",
        total: "200000000",
        amount: "0",
    },
    payload: {
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        length: 0,
    },
    generator: {
        username: "pitbull",
        address: "APRt1h4Mrimbjuqm8deiYpuX1wpaM7dfNb",
        publicKey: "03dff448e2fe490aff1665da1e217f39ac8b6715e5ecfdfec20bc150da70ef5153",
    },
    signature:
        "304402203974f10df9c73626c861f1d5164d4b7f10e6a0337d0208474bb389a38cc173b00220552c0a65d090e0ddf258538fb5638fbd1c7a2bdea12e6da9b6d45d82266f44c5",
    confirmations: 0,
    transactions: 0,
    timestamp: {
        epoch: 94874968,
        unix: 1584976168,
        human: "2020-03-23T15:09:28.000Z",
    },
};

export const delegateResponse = {
    username: "biz_classic",
    address: "AKdr5d9AMEnsKYxpDcoHdyyjSCKVx3r9Nj",
    publicKey: "020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92",
    votes: "310346399863193",
    rank: 1,
    isResigned: false,
    blocks: {
        produced: 209963,
        last: {
            id: "00ac24e91568bc2e33918f1c2b54bcab60aa56f4d50dc1a13df34b0ca5b102c3",
            height: 11712266,
            timestamp: {
                epoch: 94874824,
                unix: 1584976024,
                human: "2020-03-23T15:07:04.000Z",
            },
        },
    },
    production: {
        approval: 2.09,
    },
    forged: {
        fees: "1173040419815",
        rewards: "41992600000000",
        total: "43165640419815",
    },
};

export const walletResponse = {
    address: "AUexKjGtgsSpVzPLs6jNMM6vJ6znEVTQWK",
    publicKey: "02ff171adaef486b7db9fc160b28433d20cf43163d56fd28fee72145f0d5219a4b",
    nonce: "122533",
    balance: "704589827182762",
    attributes: {
        vote: "03a28aeb6b15e792f1753caae663a52f15ab642ae7cdee6fcdbc5416ffc0f4f702",
    },
    isDelegate: false,
    isResigned: false,
    vote: "03a28aeb6b15e792f1753caae663a52f15ab642ae7cdee6fcdbc5416ffc0f4f702",
};

export const lockResponse = {
    lockId: "208b7877046a7f93d731ed2408bfe3fe126c5368b7967b246311c2408ecc7688",
    amount: "5",
    secretHash: "d7914fe546b684688bb95f4f888a92dfc680603a75f23eb823658031fff766d9",
    senderPublicKey: "027ab77a71c903893c6264f0997455534c8a9dfd4608b3bc59d3fb6366f5475b0b",
    recipientId: "DPTbJqyvrPgBmhs6UFqBwFdyx6jvorxHNL",
    timestamp: {
        epoch: 93993832,
        unix: 1584095032,
        human: "2020-03-13T10:23:52.000Z",
    },
    expirationType: 1,
    expirationValue: 1504193605,
    isExpired: false,
};

export const htlcLockAsset = {
    secretHash: "dummy hash",
    expiration: {
        type: HtlcLockExpirationType.EpochTimestamp,
        value: 5,
    },
};

export const htlcClaimAsset = {
    lockTransactionId: "12345",
    unlockSecret: "dummy unlock secret",
};

export const htlcRefundAsset = {
    lockTransactionId: "12345",
};

export const businessRegistrationAsset = {
    name: "DummyBusiness",
    website: "https://www.dummy.example",
    vat: "EX1234567890",
    repository: "https://www.dummy.example/repo",
};

export const businessUpdateAsset = {
    name: "DummyBusiness",
    website: "https://www.dummy.example",
    vat: "EX1234567890",
    repository: "https://www.dummy.example/repo",
};

export const bridgechainRegistrationAsset = {
    name: "arkecosystem1",
    seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
    genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: { "@arkecosystem/core-api": 12345 },
};

export const bridgechainUpdateAsset = {
    bridgechainId: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
    seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
    bridgechainRepository: "http://www.repository.com/myorg/myrepo",
    bridgechainAssetRepository: "http://www.repository.com/myorg/myassetrepo",
    ports: { "@arkecosystem/core-api": 12345 },
};

export const passphrasePairsAsset = [
    {
        passphrase: passphrases[0],
        secondPassphrase: passphrases[1],
    },
    {
        passphrase: passphrases[3],
        secondPassphrase: passphrases[4],
    },
];

export const entityAsset = {
    type: EntityType.Business,
    subType: 0,
    action: EntityAction.Register,
    data: {
        name: "DummyName",
        ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
    },
};
