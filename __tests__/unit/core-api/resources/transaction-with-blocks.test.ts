import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { TransactionWithBlockResource } from "@packages/core-api/src/resources";
import { Interfaces, Utils } from "@packages/crypto";
import { cloneDeep } from "lodash";

let sandbox: Sandbox;
let resource: TransactionWithBlockResource;

const transaction = {
    version: 1,
    network: 23,
    type: 3,
    timestamp: 0,
    senderPublicKey: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
    fee: Utils.BigNumber.make("0"),
    amount: Utils.BigNumber.make("0"),
    asset: {
        votes: ["02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a"],
    },
    signature:
        "304402203aa292e7aedcd62bb5a79c2521b666b8e1886b57923d98f51911b0461cfdb5db0220539657d5c1dcb78c2c86376da87cc0db428e03c53da3f4f64ebe7115998f00b6",
    typeGroup: 1,
    recipientId: "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
    id: "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
    nonce: Utils.BigNumber.make("2"),
    blockId: "17184958558311101492",
    sequence: 152,
};

const transactionRaw = {
    version: 1,
    network: 23,
    type: 3,
    timestamp: 0,
    senderPublicKey: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
    fee: "0",
    amount: "0",
    asset: {
        votes: ["02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a"],
    },
    signature:
        "304402203aa292e7aedcd62bb5a79c2521b666b8e1886b57923d98f51911b0461cfdb5db0220539657d5c1dcb78c2c86376da87cc0db428e03c53da3f4f64ebe7115998f00b6",
    typeGroup: 1,
    recipientId: "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
    id: "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
    nonce: "2",
    blockId: "17184958558311101492",
    sequence: 152,
};

const block: Interfaces.IBlockData = {
    version: 0,
    timestamp: 103497376,
    height: 152,
    previousBlockHex: "23d6352eb4450dfb",
    previousBlock: "2582309911052750331",
    numberOfTransactions: 0,
    totalAmount: Utils.BigNumber.make("0"),
    totalFee: Utils.BigNumber.make("0"),
    reward: Utils.BigNumber.make("0"),
    payloadLength: 0,
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    generatorPublicKey: "021770413ad01c60b94e1d3ed44c00e0145fe7897e40f5f6265e220f4e65cf427f",
    blockSignature:
        "3045022100f43e1133e74eca9fa8090c9b581fb1727d1e007818a53247ff9272b6bb64242e02201473233d08829d9ee6c35fee462a62911d675f1dc3ab66798882475b5acabb86",
    idHex: "420d4f574229b758",
    id: "4759547617391261528",
};

const blockRaw = {
    version: 0,
    timestamp: 103497376,
    height: 152,
    previousBlockHex: "23d6352eb4450dfb",
    previousBlock: "2582309911052750331",
    numberOfTransactions: 0,
    totalAmount: "0",
    totalFee: "0",
    reward: "0",
    payloadLength: 0,
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    generatorPublicKey: "021770413ad01c60b94e1d3ed44c00e0145fe7897e40f5f6265e220f4e65cf427f",
    blockSignature:
        "3045022100f43e1133e74eca9fa8090c9b581fb1727d1e007818a53247ff9272b6bb64242e02201473233d08829d9ee6c35fee462a62911d675f1dc3ab66798882475b5acabb86",
    idHex: "420d4f574229b758",
    id: "4759547617391261528",
};

const transactionDataWithBlockData = {
    data: transaction,
    block: block,
};

const transactionDataWithBlockDataRaw = {
    data: transactionRaw,
    block: blockRaw,
};

const transactionDataWithBlockDataTransformed = {
    amount: "0",
    asset: {
        votes: ["02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a"],
    },
    blockId: "17184958558311101492",
    confirmations: 49,
    fee: "0",
    id: "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
    nonce: "2",
    recipient: "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
    sender: "D8791H5uhZcg1tJmpryVUFanvLth52AmrJ",
    senderPublicKey: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
    signSignature: undefined,
    signature:
        "304402203aa292e7aedcd62bb5a79c2521b666b8e1886b57923d98f51911b0461cfdb5db0220539657d5c1dcb78c2c86376da87cc0db428e03c53da3f4f64ebe7115998f00b6",
    signatures: undefined,
    timestamp: {
        epoch: 103497376,
        human: "2020-07-01T10:16:16.000Z",
        unix: 1593598576,
    },
    type: 3,
    typeGroup: 1,
    vendorField: undefined,
    version: 1,
};

let mockWalletRepository;
let mockStateStore;

beforeEach(() => {
    mockWalletRepository = {
        findByPublicKey: () => {
            return {
                getAddress: jest.fn().mockReturnValue("D8791H5uhZcg1tJmpryVUFanvLth52AmrJ"),
            };
        },
    };
    mockStateStore = {
        getLastHeight: () => {
            return 200;
        },
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue(mockWalletRepository);
    sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(mockStateStore);

    resource = sandbox.app.resolve<TransactionWithBlockResource>(TransactionWithBlockResource);
});

describe("TransactionResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(transactionDataWithBlockData)).toEqual(transactionDataWithBlockDataRaw);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(transactionDataWithBlockData)).toEqual(transactionDataWithBlockDataTransformed);
        });

        it("should return transformed object if recipientId is undefined", async () => {
            const tmpTransactionDataWithBlockData = cloneDeep(transactionDataWithBlockData);
            const tmpTransactionDataWithBlockDataTransformed = cloneDeep(transactionDataWithBlockDataTransformed);

            delete tmpTransactionDataWithBlockData.data.recipientId;
            tmpTransactionDataWithBlockDataTransformed.recipient = "D8791H5uhZcg1tJmpryVUFanvLth52AmrJ";

            expect(resource.transform(tmpTransactionDataWithBlockData)).toEqual(
                tmpTransactionDataWithBlockDataTransformed,
            );
        });

        it("should return transformed with signSignature", async () => {
            const tmpTransactionDataWithBlockData = cloneDeep(transactionDataWithBlockData);
            const tmpTransactionDataWithBlockDataTransformed = cloneDeep(transactionDataWithBlockDataTransformed);

            // @ts-ignore
            tmpTransactionDataWithBlockData.data.signSignature = "dummy_signature";
            // @ts-ignore
            tmpTransactionDataWithBlockDataTransformed.signSignature = "dummy_signature";

            expect(resource.transform(tmpTransactionDataWithBlockData)).toEqual(
                tmpTransactionDataWithBlockDataTransformed,
            );
        });

        it("should return transformed with secondSignature", async () => {
            const tmpTransactionDataWithBlockData = cloneDeep(transactionDataWithBlockData);
            const tmpTransactionDataWithBlockDataTransformed = cloneDeep(transactionDataWithBlockDataTransformed);

            // @ts-ignore
            tmpTransactionDataWithBlockData.data.secondSignature = "dummy_signature";
            // @ts-ignore
            tmpTransactionDataWithBlockDataTransformed.signSignature = "dummy_signature";

            expect(resource.transform(tmpTransactionDataWithBlockData)).toEqual(
                tmpTransactionDataWithBlockDataTransformed,
            );
        });
    });
});
