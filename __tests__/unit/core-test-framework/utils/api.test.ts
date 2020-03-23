import "jest-extended";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Identifiers } from "@arkecosystem/core-api";
import { ApiHelpers } from "@packages/core-test-framework/src/utils/api";
import { Utils } from "@arkecosystem/core-kernel";


let sandbox: Sandbox;
let api: ApiHelpers;

let mockResponse: any = '{test:"test"}';

let mockServer = {
    async inject(options: any) {
        return mockResponse;
    }
};

beforeEach(async () => {
    sandbox = new Sandbox();

    sandbox.app.bind(Identifiers.HTTP).toConstantValue(mockServer);

    api = new ApiHelpers(sandbox.app);
});

afterEach(() => {
    jest.resetAllMocks();
});


describe("ApiHelpers", () => {
    describe("request", () => {
        it("should return response", async () => {
            let response = await api.request("GET", "blockchain", "dummy_params");
            expect(response).toBe(response);
        })
    });

    describe("expectJson", () => {
        it("should pass", async () => {
            let response = {
                data: {}
            };

            api.expectJson(response);
        });
    });

    describe("expectStatus", () => {
        it("should pass", async () => {
            let response = {
                status: 200
            };

            api.expectStatus(response, 200);
        });
    });

    describe("expectResource", () => {
        it("should pass", async () => {
            let response = {
                data: {
                    data: {}
                }
            };

            api.expectResource(response);
        });
    });

    describe("expectCollection", () => {
        it("should pass", async () => {
            let response = {
                data: {
                    data: []
                }
            };

            api.expectCollection(response);
        });
    });

    describe("expectPaginator", () => {
        it("should pass", async () => {
            let response = {
                data: {
                    meta: {
                        count: 100,
                        pageCount: 39697,
                        totalCount: 3969602,
                        next: "/transactions?transform=true&page=2&limit=100",
                        previous: null,
                        self: "/transactions?transform=true&page=1&limit=100",
                        first: "/transactions?transform=true&page=1&limit=100",
                        last: "/transactions?transform=true&page=39697&limit=100"
                    }
                }
            };

            api.expectPaginator(response);
        });
    });

    describe("expectSuccessful", () => {
        it("should pass", async () => {
            let response = {
                data: {},
                status: 200
            };

            api.expectSuccessful(response);
        });
    });

    describe("expectError", () => {
        it("should pass", async () => {
            let response = {
                data: {
                    statusCode: 404,
                    error: "Dummy error",
                    message: "Dummy error message",
                },
                status: 404
            };

            api.expectError(response);
        });
    });

    describe("expectTransaction", () => {
        it("should pass", async () => {
            let transaction = {
                id: "0ba4644be6f8f81b5fa287c6655cedfae54bd8c8adb47098d0325c1f651c67f3",
                blockId: "92f5989502f4b0a92c1a68f865efc508b759a9a830f99bc69016a1e4dc7e5308",
                version: 2,
                type: 0,
                typeGroup: 1,
                amount: "168198030022",
                fee: "10000000",
                sender: "AN1sKCduJc9P9w5kzh4jc5ZSpypVxYTZ4H",
                senderPublicKey: "0323cf2a40305eeb29f2200fcb153f3e38bca5b2d1138444fd508f928ed5bf4fc9",
                recipient: "AFrPtEmzu6wdVpa2CnRDEKGQQMWgq8nE9V",
                signature: "3045022100ad1a10a0042dc6fc0ef3848342f0236032916af3d8093b3f3ce5ae11c879db8c022024236440299dc6ade1c9d2e9eb807705ea09a88dc412bfa8b03e1b556cc64588",
                vendorField: "binance",
                confirmations: 88,
                timestamp: {
                    epoch: 94874040,
                    unix: 1584975240,
                    human: "2020-03-23T14:54:00.000Z"
                },
                nonce: "3"
            };

            api.expectTransaction(transaction);
        });
    });

    describe("expectBlock", () => {
        it("should pass", async () => {
            let block = {
                id: "cba1860a42ae78b8454fb73c5a5270e100246fb0097078d341152783e7f350cd",
                version: 0,
                height: 11712284,
                previous: "39f0f778d58c16b8a4deb259dda2ac0a91b08fa9ce5d7b037188125bb0a349c9",
                forged: {
                    reward: "200000000",
                    fee: "0",
                    total: "200000000",
                    amount: "0"
                },
                payload: {
                    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    length: 0
                },
                generator: {
                    username: "pitbull",
                    address: "APRt1h4Mrimbjuqm8deiYpuX1wpaM7dfNb",
                    publicKey: "03dff448e2fe490aff1665da1e217f39ac8b6715e5ecfdfec20bc150da70ef5153"
                },
                signature: "304402203974f10df9c73626c861f1d5164d4b7f10e6a0337d0208474bb389a38cc173b00220552c0a65d090e0ddf258538fb5638fbd1c7a2bdea12e6da9b6d45d82266f44c5",
                confirmations: 0,
                transactions: 0,
                timestamp: {
                    epoch: 94874968,
                    unix: 1584976168,
                    human: "2020-03-23T15:09:28.000Z"
                }
            };

            api.expectBlock(block);
        });
    });

    describe("expectDelegate", () => {
        it("should pass", async () => {
            let delegate = {
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
                            human: "2020-03-23T15:07:04.000Z"
                        }
                    }
                },
                production: {
                    approval: 2.09
                },
                forged: {
                    fees: "1173040419815",
                    rewards: "41992600000000",
                    total: "43165640419815"
                }
            };

            api.expectDelegate(delegate);
        });
    });

    describe("expectWallet", () => {
        it("should pass", async () => {

            // TODO: Check why is vote required
            let wallet = {
                address: "AUexKjGtgsSpVzPLs6jNMM6vJ6znEVTQWK",
                publicKey: "02ff171adaef486b7db9fc160b28433d20cf43163d56fd28fee72145f0d5219a4b",
                nonce: "122533",
                balance: "704589827182762",
                attributes: {
                    vote: "03a28aeb6b15e792f1753caae663a52f15ab642ae7cdee6fcdbc5416ffc0f4f702"
                },
                isDelegate: false,
                isResigned: false,
                vote: "03a28aeb6b15e792f1753caae663a52f15ab642ae7cdee6fcdbc5416ffc0f4f702"
            };

            api.expectWallet(wallet);
        });
    });

    describe("expectLock", () => {
        it("should pass", async () => {
            let lock = {
                lockId: "208b7877046a7f93d731ed2408bfe3fe126c5368b7967b246311c2408ecc7688",
                amount: "5",
                secretHash: "d7914fe546b684688bb95f4f888a92dfc680603a75f23eb823658031fff766d9",
                senderPublicKey: "027ab77a71c903893c6264f0997455534c8a9dfd4608b3bc59d3fb6366f5475b0b",
                recipientId: "DPTbJqyvrPgBmhs6UFqBwFdyx6jvorxHNL",
                timestamp: {
                    epoch: 93993832,
                    unix: 1584095032,
                    human: "2020-03-13T10:23:52.000Z"
                },
                expirationType: 1,
                expirationValue: 1504193605,
                isExpired: false
            };

            api.expectLock(lock);
        });
    });

    describe("createTransfer", () => {
        it("should create transfer transaction", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(Utils.http, "post").mockImplementation(async (url: any, opts: any) => {});

            let transaction = await api.createTransfer();

            expect(transaction).toBeObject();
            expect(transaction.id).toBeDefined();
            expect(transaction.signature).toBeDefined();
            expect(transaction.version).toBeDefined();
            expect(transaction.type).toBeDefined();
            expect(transaction.typeGroup).toBeDefined();
            expect(transaction.fee).toBeDefined();
            expect(transaction.amount).toBeDefined();
            expect(transaction.nonce).toBeDefined();
            expect(transaction.recipientId).toBeDefined();

            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
