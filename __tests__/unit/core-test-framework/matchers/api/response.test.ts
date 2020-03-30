import "@packages/core-test-framework/src/matchers/api/response";

let response: any;

beforeEach(() => {
    response = {
        data: {
            test: "test",
            meta: {
                pageCount: 5,
                totalCount: 25,
                next: undefined,
                previous: undefined,
                self: undefined,
                first: undefined,
                last: undefined,
            },
        },
        status: 200,
        headers: {},
    };
});

describe("Response", () => {
    describe("toBeSuccessfulResponse", () => {
        it("should be successful response", async () => {
            expect(response).toBeSuccessfulResponse();
        });

        it("should not be successful response", async () => {
            delete response.data;
            expect(response).not.toBeSuccessfulResponse();
        });
    });

    describe("toBePaginated", () => {
        it("should not pass if response does not contain meta", async () => {
            delete response.data.meta.pageCount;
            expect(response).not.toBePaginated();
        });

        it("should pass if response is valid", async () => {
            expect(response).toBePaginated();
        });
    });
});
