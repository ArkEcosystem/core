import "jest-extended";

import { Identifiers } from "@packages/core-api";
import { Sandbox } from "@packages/core-test-framework";
import { ApiHelpers } from "@packages/core-test-framework/src/utils/api";

import {
    blockResponse,
    delegateResponse,
    lockResponse,
    paginationResponseMeta,
    transactionResponse,
    walletResponse,
} from "./__fixtures__/assets";

let sandbox: Sandbox;
let api: ApiHelpers;

const mockResponse: any = '{test:"test"}';

const mockServer = {
    async inject(options: any) {
        return mockResponse;
    },
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
            const response = await api.request("GET", "blockchain", "dummy_params", {});
            expect(response).toBe(response);
        });

        it("should return response - without params", async () => {
            const response = await api.request("POST", "blockchain");
            expect(response).toBe(response);
        });
    });

    describe("expectJson", () => {
        it("should pass", async () => {
            const response = {
                data: {},
            };

            api.expectJson(response);
        });
    });

    describe("expectStatus", () => {
        it("should pass", async () => {
            const response = {
                status: 200,
            };

            api.expectStatus(response, 200);
        });
    });

    describe("expectResource", () => {
        it("should pass", async () => {
            const response = {
                data: {
                    data: {},
                },
            };

            api.expectResource(response);
        });
    });

    describe("expectCollection", () => {
        it("should pass", async () => {
            const response = {
                data: {
                    data: [],
                },
            };

            api.expectCollection(response);
        });
    });

    describe("expectPaginator", () => {
        it("should pass", async () => {
            const response = {
                data: {
                    meta: paginationResponseMeta,
                },
            };

            api.expectPaginator(response);
        });
    });

    describe("expectSuccessful", () => {
        it("should pass", async () => {
            const response = {
                data: {},
                status: 200,
            };

            api.expectSuccessful(response);
        });
    });

    describe("expectError", () => {
        it("should pass", async () => {
            const response = {
                data: {
                    statusCode: 404,
                    error: "Dummy error",
                    message: "Dummy error message",
                },
                status: 404,
            };

            api.expectError(response);
        });
    });

    describe("expectTransaction", () => {
        it("should pass", async () => {
            api.expectTransaction(transactionResponse);
        });
    });

    describe("expectBlock", () => {
        it("should pass", async () => {
            api.expectBlock(blockResponse);
        });

        it("should pass with expected", async () => {
            api.expectBlock(blockResponse, blockResponse);
        });
    });

    describe("expectDelegate", () => {
        it("should pass", async () => {
            api.expectDelegate(delegateResponse);
        });
        it("should pass with expected", async () => {
            api.expectDelegate(delegateResponse, delegateResponse);
        });
    });

    describe("expectWallet", () => {
        it("should pass", async () => {
            api.expectWallet(walletResponse);
        });
    });

    describe("expectLock", () => {
        it("should pass", async () => {
            api.expectLock(lockResponse);
        });
    });

    describe("createTransfer", () => {
        it("should create transfer transaction", async () => {
            // @ts-ignore
            const spyOnRequest = jest.spyOn(api, "request");

            const transaction = await api.createTransfer();

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

            expect(spyOnRequest).toHaveBeenCalled();
        });
    });

    describe("isTransactionForgedByDelegate", () => {
        let spyOnRequest;

        beforeEach(() => {
            // @ts-ignore
            spyOnRequest = jest
                .spyOn(api, "request")
                .mockImplementationOnce(async () => {
                    return {
                        data: {
                            data: {
                                blockId: "123",
                            },
                        },
                    };
                })
                .mockImplementationOnce(async () => {
                    return {
                        data: {
                            data: {
                                generator: {
                                    publicKey: "delegate_public_key",
                                },
                            },
                        },
                    };
                });
        });

        it("should check if transaction is forged by delegate", async () => {
            await expect(
                api.isTransactionForgedByDelegate("dummy_transaction_id", "delegate_public_key"),
            ).resolves.toBeTrue();

            expect(spyOnRequest).toHaveBeenCalledTimes(2);
        });

        it("should not check if transaction is not forged by delegate", async () => {
            await expect(
                api.isTransactionForgedByDelegate("dummy_transaction_id", "another_delegate_public_key"),
            ).resolves.toBeFalse();

            expect(spyOnRequest).toHaveBeenCalledTimes(2);
        });
    });
});
