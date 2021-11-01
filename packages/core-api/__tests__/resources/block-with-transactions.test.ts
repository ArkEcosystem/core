import "jest-extended";

import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Interfaces } from "@arkecosystem/crypto";
import { BlockWithTransactionsResource } from "@packages/core-api/src/resources";
import { cloneDeep } from "lodash";

let sandbox: Sandbox;
let resource: BlockWithTransactionsResource;

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

const transaction = {
    version: 1,
    network: 23,
    type: 3,
    timestamp: 0,
    senderPublicKey: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
    fee: Utils.BigNumber.make("0"),
    amount: Utils.BigNumber.make("0"),
    asset: {
        votes: ["+02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a"],
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
        votes: ["+02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a"],
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

const blockWithTransactionData: Contracts.Shared.BlockDataWithTransactionData = {
    data: block,
    transactions: [transaction],
};

const blockWithTransactionDataRaw = {
    data: blockRaw,
    transactions: [transactionRaw],
};

const multiPaymentTransaction = {
    version: 1,
    network: 23,
    type: 6, // Multipayment
    typeGroup: 1,
    timestamp: 0,
    asset: {
        payments: [
            {
                amount: Utils.BigNumber.make(100),
            },
        ],
    },
};

const blockWithTransactionDataTransformed = {
    id: "4759547617391261528",
    version: 0,
    height: 152,
    previous: "2582309911052750331",
    forged: {
        reward: "0",
        fee: "0",
        amount: "0",
        total: "0",
    },
    payload: {
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        length: 0,
    },
    generator: {
        username: "genesis_13",
        address: "ANRNMPjQjJGVsVbyeqwShcxKTidYJ2S1Hm",
        publicKey: "021770413ad01c60b94e1d3ed44c00e0145fe7897e40f5f6265e220f4e65cf427f",
    },
    signature:
        "3045022100f43e1133e74eca9fa8090c9b581fb1727d1e007818a53247ff9272b6bb64242e02201473233d08829d9ee6c35fee462a62911d675f1dc3ab66798882475b5acabb86",
    confirmations: 0,
    transactions: 0,
    timestamp: {
        epoch: 103497376,
        unix: 1593598576,
        human: "2020-07-01T10:16:16.000Z",
    },
};

let mockWallet;
let mockWalletRepository;
let mockBlockchainService;

beforeEach(() => {
    mockWallet = {
        getAddress: () => {
            return "ANRNMPjQjJGVsVbyeqwShcxKTidYJ2S1Hm";
        },
        getPublicKey: () => {
            return "021770413ad01c60b94e1d3ed44c00e0145fe7897e40f5f6265e220f4e65cf427f";
        },
        hasAttribute: () => {
            return true;
        },
        getAttribute: () => {
            return "genesis_13";
        },
    };

    mockWalletRepository = {
        findByPublicKey: () => {
            return mockWallet;
        },
    };

    mockBlockchainService = {
        getLastBlock: () => {
            return undefined;
        },
    };

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.WalletRepository).toConstantValue(mockWalletRepository);

    sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(mockBlockchainService);

    resource = sandbox.app.resolve<BlockWithTransactionsResource>(BlockWithTransactionsResource);
});

describe("DelegateResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(blockWithTransactionData)).toEqual(blockWithTransactionDataRaw);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(blockWithTransactionData)).toEqual(blockWithTransactionDataTransformed);
        });

        it("should return transformed object if delegate username is undefined", async () => {
            mockWallet.hasAttribute = jest.fn().mockReturnValue(false);

            const tmpBlockWithTransactionDataTransformed = cloneDeep(blockWithTransactionDataTransformed);

            // @ts-ignore
            tmpBlockWithTransactionDataTransformed.generator.username = undefined;

            expect(resource.transform(blockWithTransactionData)).toEqual(tmpBlockWithTransactionDataTransformed);
        });

        it("should return transformed object if last block is set", async () => {
            mockBlockchainService.getLastBlock = jest.fn().mockReturnValue({
                data: {
                    height: 200,
                },
            });

            const tmpBlockWithTransactionDataTransformed = cloneDeep(blockWithTransactionDataTransformed);

            tmpBlockWithTransactionDataTransformed.confirmations = 48;

            expect(resource.transform(blockWithTransactionData)).toEqual(tmpBlockWithTransactionDataTransformed);
        });

        it("should return transformed object with multipayment transactions", async () => {
            const tmpBlockWithTransactionData = cloneDeep(blockWithTransactionData);
            const tmpBlockWithTransactionDataTransformed = cloneDeep(blockWithTransactionDataTransformed);

            // @ts-ignore
            tmpBlockWithTransactionData.transactions.push(multiPaymentTransaction);

            tmpBlockWithTransactionDataTransformed.forged.amount = "100";

            expect(resource.transform(tmpBlockWithTransactionData)).toEqual(tmpBlockWithTransactionDataTransformed);
        });
    });
});
