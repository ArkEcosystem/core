import "jest-extended";

import { Utils } from "@arkecosystem/core-kernel";
import { DelegateResource } from "@packages/core-api/src/resources";

let resource: DelegateResource;

const delegateAttributes = {
    username: "genesis_9",
    voteBalance: Utils.BigNumber.make("245098000000000"),
    forgedFees: Utils.BigNumber.make("0"),
    forgedRewards: Utils.BigNumber.make("0"),
    producedBlocks: 1,
    rank: 39,
    round: 2,
    lastBlock: {
        version: 0,
        timestamp: 103495992,
        height: 18,
        previousBlockHex: "07d375dd7254c03c",
        previousBlock: "563923972317823036",
        numberOfTransactions: 0,
        totalAmount: "0",
        totalFee: "0",
        reward: "0",
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647",
        blockSignature:
            "3045022100fc48565d4f4f2fed4d8088714f1d18f6504038fca1c91219db7d266bc3039a0202207fc0cfba9083b33d52f45911f769e414dfdccf993f9d9ee4e5baf552568d7688",
        idHex: "8628d253ef86dec0",
        id: "9667207858093481664",
    },
};

const delegate = {
    username: "genesis_9",
    address: "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
    publicKey: "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647",
    votes: "245098000000000",
    rank: 39,
    isResigned: false,
    blocks: {
        produced: 0,
    },
    production: {
        approval: 1.96,
    },
    forged: {
        fees: "0",
        rewards: "0",
        total: "0",
    },

    getAttribute: (key: string) => {
        if (key === "delegate.voteBalance") {
            return delegateAttributes.voteBalance;
        }
        return delegateAttributes;
    },
};

const delegateTransformed = {
    address: "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
    blocks: {
        last: {
            height: 18,
            id: "9667207858093481664",
            timestamp: {
                epoch: 103495992,
                human: "2020-07-01T09:53:12.000Z",
                unix: 1593597192,
            },
        },
        produced: 1,
    },
    forged: {
        fees: "0",
        rewards: "0",
        total: "0",
    },
    isResigned: false,
    production: {
        approval: 1.96,
    },
    publicKey: "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647",
    rank: 39,
    username: "genesis_9",
    votes: "245098000000000",
};

beforeEach(() => {
    resource = new DelegateResource();
});

describe("DelegateResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(delegate)).toEqual(delegate);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(delegate)).toEqual(delegateTransformed);
        });

        it("should return transformed object - without block", async () => {
            delete delegateAttributes.lastBlock;
            delete delegateTransformed.blocks.last;

            expect(resource.transform(delegate)).toEqual(delegateTransformed);
        });
    });
});
