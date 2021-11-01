import "jest-extended";

import { TransactionResource } from "@packages/core-api/src/resources";
import { Application } from "@packages/core-kernel";
import { Utils } from "@packages/crypto";
import { cloneDeep } from "lodash";

import { initApp } from "../__support__";

let app: Application;
let resource: TransactionResource;

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

const transactionTransformed = {
    id: "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
    blockId: "17184958558311101492",
    version: 1,
    type: 3,
    typeGroup: 1,
    amount: "0",
    fee: "0",
    sender: "D8791H5uhZcg1tJmpryVUFanvLth52AmrJ",
    senderPublicKey: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
    recipient: "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
    signature:
        "304402203aa292e7aedcd62bb5a79c2521b666b8e1886b57923d98f51911b0461cfdb5db0220539657d5c1dcb78c2c86376da87cc0db428e03c53da3f4f64ebe7115998f00b6",
    asset: {
        votes: ["+02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a"],
    },
    confirmations: 0,
    timestamp: {
        epoch: 0,
        unix: 1490101200,
        human: "2017-03-21T13:00:00.000Z",
    },
    nonce: "2",
    signSignature: undefined,
    signatures: undefined,
    vendorField: undefined,
};

beforeEach(() => {
    app = initApp();

    resource = app.resolve<TransactionResource>(TransactionResource);
});

describe("TransactionResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(transaction)).toEqual(transactionRaw);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(transaction)).toEqual(transactionTransformed);
        });

        it("should return transformed object - without recipient defined", async () => {
            const tmpTransaction = cloneDeep(transaction);
            const tmpTransactionTransformed = cloneDeep(transactionTransformed);

            delete tmpTransaction.recipientId;
            tmpTransactionTransformed.recipient = "D8791H5uhZcg1tJmpryVUFanvLth52AmrJ";

            expect(resource.transform(tmpTransaction)).toEqual(tmpTransactionTransformed);
        });

        it("should return transformed object - without timestamp defined", async () => {
            const tmpTransaction = cloneDeep(transaction);
            const tmpTransactionTransformed = cloneDeep(transactionTransformed);

            delete tmpTransaction.timestamp;
            // @ts-ignore
            tmpTransactionTransformed.timestamp = undefined;

            expect(resource.transform(tmpTransaction)).toEqual(tmpTransactionTransformed);
        });
    });
});
