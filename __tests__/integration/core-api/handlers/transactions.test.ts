import "../../../utils";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

import { Identities } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";
import { delegates } from "../../../utils/fixtures/testnet/delegates";
import { generateWallets } from "../../../utils/generators/wallets";

const transferFee = 10000000;

let genesisTransaction;
let genesisTransactions;

let transactionId;
let blockId;
let type;
let wrongType;
let version;
let senderPublicKey;
let senderAddress;
let recipientAddress;
let timestamp;
let timestampFrom;
let timestampTo;
let amount;
let amountFrom;
let amountTo;
let fee;
let feeFrom;
let feeTo;

beforeAll(async () => {
    await setUp();

    genesisTransactions = genesisBlock.transactions;
    genesisTransaction = genesisTransactions[0];

    transactionId = genesisTransaction.id;
    blockId = genesisBlock.id;
    type = genesisTransaction.type;
    wrongType = 3;
    version = 1;
    senderPublicKey = genesisTransaction.senderPublicKey;
    senderAddress = Identities.Address.fromPublicKey(genesisTransaction.senderPublicKey, 23);
    recipientAddress = genesisTransaction.recipientId;
    timestamp = genesisTransaction.timestamp;
    timestampFrom = timestamp;
    timestampTo = timestamp;
    amount = +genesisTransaction.amount.toFixed();
    amountFrom = amount;
    amountTo = amount;
    fee = +genesisTransaction.fee.toFixed();
    feeFrom = fee;
    feeTo = fee;
});

afterAll(async () => await tearDown());

describe("API 2.0 - Transactions", () => {
    describe("GET /transactions", () => {
        it("should GET all the transactions", async () => {
            const response = await utils.request("GET", "transactions");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectTransaction(response.data.data[0]);
        });

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "transactions");
            expect(response).toBeSuccessfulResponse();

            const expectedMeta = {
                count: 100,
                first: "/transactions?transform=true&page=1&limit=100",
                last: "/transactions?transform=true&page=2&limit=100",
                next: "/transactions?transform=true&page=2&limit=100",
                pageCount: 2,
                previous: null,
                self: "/transactions?transform=true&page=1&limit=100",
                totalCount: expect.any(Number), // for some reason it can give a different number,
                // if it's executed with the whole test suite :think: TODO fix it
                totalCountIsEstimate: true,
            };
            expect(response.data.meta).toEqual(expectedMeta);
        });
    });

    describe("GET /transactions/:id", () => {
        it("should GET a transaction by the given identifier", async () => {
            const response = await utils.request("GET", `transactions/${transactionId}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const transaction = response.data.data;
            utils.expectTransaction(transaction);
            expect(transaction.id).toBe(transactionId);
        });

        it("should GET a transaction by the given identifier and not transform it", async () => {
            const response = await utils.request(
                "GET",
                "transactions/8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
                { transform: false },
            );
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data).toEqual({
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
                recipientId: "AJjv7WztjJNYHrLAeveG5NgHWp6699ZJwD",
                id: "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
            });
        });

        it("should fail to GET a transaction by the given identifier if it doesn't exist", async () => {
            utils.expectError(
                await utils.request(
                    "GET",
                    "transactions/9816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
                ),
                404,
            );
        });
    });

    describe("GET /transactions/unconfirmed", () => {
        it("should GET all the unconfirmed transactions", async () => {
            await utils.createTransaction();

            const response = await utils.request("GET", "transactions/unconfirmed");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
        });
    });

    describe("GET /transactions/unconfirmed/:id", () => {
        it("should GET an unconfirmed transaction by the given identifier", async () => {
            const transaction = await utils.createTransaction();

            const response = await utils.request("GET", `transactions/unconfirmed/${transaction.id}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data).toHaveProperty("id", transaction.id);
        });

        it("should fail to GET a transaction by the given identifier if it doesn't exist", async () => {
            utils.expectError(
                await utils.request(
                    "GET",
                    "transactions/unconfirmed/9816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
                ),
                404,
            );
        });
    });

    describe("GET /transactions/types", () => {
        it("should GET transaction types", async () => {
            const response = await utils.request("GET", "transactions/types");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data).toEqual({
                1: {
                    Transfer: 0,
                    SecondSignature: 1,
                    DelegateRegistration: 2,
                    Vote: 3,
                    MultiSignature: 4,
                    Ipfs: 5,
                    MultiPayment: 6,
                    DelegateResignation: 7,
                    HtlcLock: 8,
                    HtlcClaim: 9,
                    HtlcRefund: 10,
                },
                2: {
                    // Marketplace stuff
                    BusinessRegistration: 0,
                    BusinessResignation: 1,
                    BusinessUpdate: 2,
                    BridgechainRegistration: 3,
                    BridgechainResignation: 4,
                    BridgechainUpdate: 5,
                },
            });
        });
    });

    describe("POST /transactions/search", () => {
        it("should POST a search for transactions with the exact specified transactionId", async () => {
            const response = await utils.request("POST", "transactions/search", {
                id: transactionId,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.id).toBe(transactionId);
            }
        });

        it("should POST a search for transactions with the exact specified blockId", async () => {
            const response = await utils.request("POST", "transactions/search", {
                blockId,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(100);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.blockId).toBe(blockId);
            }
        });

        it("should POST a search for transactions with the exact specified type", async () => {
            const response = await utils.request("POST", "transactions/search", {
                type,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.type).toBe(type);
            }
        });

        it("should POST a search for transactions with the exact specified version", async () => {
            const response = await utils.request("POST", "transactions/search", {
                version,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(100);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.version).toBe(version);
            }
        });

        it("should POST a search for transactions with the exact specified senderPublicKey", async () => {
            const response = await utils.request("POST", "transactions/search", {
                senderPublicKey,
            });

            expect(response).toBeSuccessfulResponse();

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.sender).toBe(senderAddress);
            }
        });

        it("should POST a search for transactions with the exact specified senderId", async () => {
            const response = await utils.request("POST", "transactions/search", {
                senderId: senderAddress,
            });

            expect(response).toBeSuccessfulResponse();

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.sender).toBe(senderAddress);
            }
        });

        it("should POST a search for transactions with the exact specified recipientId (Address)", async () => {
            const response = await utils.request("POST", "transactions/search", {
                recipientId: recipientAddress,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(3);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.recipient).toBe(recipientAddress);
            }
        });

        it("should POST a search for transactions with the any of the specified addresses", async () => {
            const response = await utils.request("POST", "transactions/search", {
                addresses: [genesisTransactions[3].recipientId, genesisTransactions[8].recipientId],
            });

            expect(response).toBeSuccessfulResponse();

            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(6);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
            }
        });

        it("should POST a search for transactions with the exact specified timestamp", async () => {
            const response = await utils.request("POST", "transactions/search", {
                timestamp: {
                    from: timestamp,
                    to: timestamp,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(100);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.timestamp.epoch).toBe(timestamp);
            }
        });

        it("should POST a search for transactions with the specified timestamp range", async () => {
            const response = await utils.request("POST", "transactions/search", {
                timestamp: {
                    from: timestampFrom,
                    to: timestampTo,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(100);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.timestamp.epoch).toBeGreaterThanOrEqual(timestampFrom);
                expect(transaction.timestamp.epoch).toBeLessThanOrEqual(timestampTo);
            }
        });

        it("should POST a search for transactions with the exact specified amount", async () => {
            const response = await utils.request("POST", "transactions/search", {
                amount: {
                    from: amount,
                    to: amount,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(50);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(+transaction.amount).toBe(amount);
            }
        });

        it("should POST a search for transactions with the specified amount range", async () => {
            const response = await utils.request("POST", "transactions/search", {
                amount: {
                    from: amountFrom,
                    to: amountTo,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(50);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(+transaction.amount).toBeGreaterThanOrEqual(amountFrom);
                expect(+transaction.amount).toBeLessThanOrEqual(amountTo);
            }
        });

        it("should POST a search for transactions with the exact specified fee", async () => {
            const response = await utils.request("POST", "transactions/search", {
                fee: {
                    from: fee,
                    to: fee,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(100);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(+transaction.fee).toBe(fee);
            }
        });

        it("should POST a search for transactions with the specified fee range", async () => {
            const response = await utils.request("POST", "transactions/search", {
                fee: {
                    from: feeFrom,
                    to: feeTo,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(100);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(+transaction.fee).toBeGreaterThanOrEqual(feeFrom);
                expect(+transaction.fee).toBeLessThanOrEqual(feeTo);
            }
        });

        it("should POST a search for transactions with the exact specified vendorField", async () => {
            const dummyTransaction = await utils.createTransaction();

            const response = await utils.request("POST", "transactions/search", {
                vendorField: dummyTransaction.vendorField,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            // TODO: the response is sometimes empty. Racy test?
            // expect(response.data.data).toHaveLength(1);

            for (const transaction of response.data.data) {
                utils.expectTransaction(transaction);
                expect(transaction.vendorField).toBe(dummyTransaction.vendorField);
            }
        });

        it("should POST a search for transactions with the wrong specified type", async () => {
            const response = await utils.request("POST", "transactions/search", {
                id: transactionId,
                type: wrongType,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(0);
        });

        it("should POST a search for transactions with the specific criteria", async () => {
            const response = await utils.request("POST", "transactions/search", {
                senderPublicKey,
                type,
                timestamp: {
                    from: timestampFrom,
                    to: timestampTo,
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            utils.expectTransaction(response.data.data[0]);
        });

        it("should POST a search for transactions with an asset matching any delegate", async () => {
            const response = await utils.request("POST", "transactions/search", {
                asset: {
                    delegate: {},
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);
            utils.expectTransaction(response.data.data[0]);
        });

        it("should POST a search for transactions with an asset matching any delegate and sender public key", async () => {
            const response = await utils.request("POST", "transactions/search", {
                asset: {
                    delegate: {},
                },
                senderPublicKey: "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647",
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            utils.expectTransaction(response.data.data[0]);
        });

        it("should POST a search for transactions with an wrong asset", async () => {
            const response = await utils.request("POST", "transactions/search", {
                asset: {
                    garbage: {},
                },
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(0);
        });
    });

    describe("POST /transactions", () => {
        const transactions = TransactionFactory.transfer(delegates[1].address)
            .withNetwork("testnet")
            .withPassphrase(delegates[0].secret)
            .create(40);

        it("should POST all the transactions", async () => {
            const response = await utils.request("POST", "transactions", {
                transactions,
            });
            expect(response).toBeSuccessfulResponse();
        });

        it("should not POST all the transactions", async () => {
            const response = await utils.request("POST", "transactions", {
                transactions: transactions.concat(transactions),
            });

            expect(response.data.statusCode).toBe(422);
            expect(response.data.message).toBe("should NOT have more than 40 items");
        });

        // FIXME
        it.skip("should POST 2 transactions double spending and get only 1 accepted and broadcasted", async () => {
            const transactions = TransactionFactory.transfer(
                delegates[1].address,
                245098000000000 - 5098000000000, // a bit less than the delegates' balance
            )
                .withNetwork("testnet")
                .withPassphrase(delegates[0].secret)
                .create(2);

            const response = await utils.request("POST", "transactions", {
                transactions,
            });

            expect(response).toBeSuccessfulResponse();

            expect(response.data.data.accept).toHaveLength(1);
            expect(response.data.data.accept[0]).toBe(transactions[0].id);

            expect(response.data.data.broadcast).toHaveLength(1);
            expect(response.data.data.broadcast[0]).toBe(transactions[0].id);

            expect(response.data.data.invalid).toHaveLength(1);
            expect(response.data.data.invalid[0]).toBe(transactions[1].id);
        });

        it.each([3, 5, 8])("should accept and broadcast %i transactions emptying a wallet", async txNumber => {
            const sender = delegates[txNumber]; // use txNumber so that we use a different delegate for each test case
            const receivers = generateWallets("testnet", 2);
            const amountPlusFee = Math.floor(+sender.balance / txNumber);
            const lastAmountPlusFee = +sender.balance - (txNumber - 1) * amountPlusFee;

            const transactions = TransactionFactory.transfer(receivers[0].address, amountPlusFee - transferFee)
                .withPassphrase(sender.secret)
                .create(txNumber - 1);

            const lastTransaction = TransactionFactory.transfer(receivers[0].address, lastAmountPlusFee - transferFee)
                .withNonce(transactions[transactions.length - 1].nonce)
                .withPassphrase(sender.secret)
                .create();

            const allTransactions = transactions.concat(lastTransaction);

            const response = await utils.request("POST", "transactions", {
                transactions: allTransactions,
            });

            expect(response).toBeSuccessfulResponse();

            expect(response.data.data.accept.sort()).toEqual(allTransactions.map(transaction => transaction.id).sort());
            expect(response.data.data.broadcast.sort()).toEqual(
                allTransactions.map(transaction => transaction.id).sort(),
            );
            expect(response.data.data.invalid).toHaveLength(0);
        });

        it.each([3, 5, 8])(
            "should not accept the last of %i transactions emptying a wallet when the last one is 1 satoshi too much",
            async txNumber => {
                const sender = delegates[txNumber + 1]; // use txNumber + 1 so that we don't use the same delegates as the above test
                const receivers = generateWallets("testnet", 2);
                const amountPlusFee = Math.floor(+sender.balance / txNumber);
                const lastAmountPlusFee = +sender.balance - (txNumber - 1) * amountPlusFee + 1;

                const transactions = TransactionFactory.transfer(receivers[0].address, amountPlusFee - transferFee)
                    .withNetwork("testnet")
                    .withPassphrase(sender.secret)
                    .create(txNumber - 1);

                const senderNonce = TransactionFactory.getNonce(sender.publicKey);
                const lastTransaction = TransactionFactory.transfer(
                    receivers[1].address,
                    lastAmountPlusFee - transferFee,
                )
                    .withNetwork("testnet")
                    .withPassphrase(sender.secret)
                    .withNonce(senderNonce.plus(txNumber - 1))
                    .create();
                // we change the receiver in lastTransaction to prevent having 2 exact same transactions with same id (if not, could be same as transactions[0])

                const allTransactions = transactions.concat(lastTransaction);

                const response = await utils.request("POST", "transactions", {
                    transactions: allTransactions,
                });

                expect(response).toBeSuccessfulResponse();

                expect(response.data.data.accept.sort()).toEqual(
                    transactions.map(transaction => transaction.id).sort(),
                );
                expect(response.data.data.broadcast.sort()).toEqual(
                    transactions.map(transaction => transaction.id).sort(),
                );
                expect(response.data.data.invalid).toEqual(lastTransaction.map(transaction => transaction.id));
            },
        );
    });

    describe("GET /transactions/fees", () => {
        it("should GET all the transaction fees", async () => {
            const response = await utils.request("GET", "transactions/fees");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toEqual({
                "1": {
                    delegateRegistration: "2500000000",
                    delegateResignation: "2500000000",
                    htlcClaim: "0",
                    htlcLock: "10000000",
                    htlcRefund: "0",
                    ipfs: "500000000",
                    multiPayment: "10000000",
                    multiSignature: "500000000",
                    secondSignature: "500000000",
                    transfer: "10000000",
                    vote: "100000000",
                },
                "2": {
                    bridgechainRegistration: "5000000000",
                    bridgechainResignation: "5000000000",
                    bridgechainUpdate: "5000000000",
                    businessRegistration: "5000000000",
                    businessResignation: "5000000000",
                    businessUpdate: "5000000000",
                },
            });
        });
    });
});
