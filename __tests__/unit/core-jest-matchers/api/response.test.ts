import "../../../../packages/core-jest-matchers/src/api/response";

let response;

beforeEach(() => {
    response = {
        status: 200,
        headers: {},
        data: {
            meta: {
                pageCount: "",
                totalCount: "",
                next: "",
                previous: "",
                self: "",
                first: "",
                last: "",
            },
        },
    };
});

describe(".toBeSuccessfulResponse", () => {
    test("passes when given a successful response", () => {
        expect(response).toBeSuccessfulResponse();
    });

    test("fails when given an unsuccessful response", () => {
        response.status = 404;
        expect(expect(response).toBeSuccessfulResponse).toThrowError(/Expected .* to be a successful response/);
    });

    test("fails when not given a response object", () => {
        response = "invalid";
        expect(expect(response).toBeSuccessfulResponse).toThrowError(/Expected .* to be a successful response/);
    });
});

describe(".toBePaginated", () => {
    test("passes when given a paginated response", () => {
        expect(response).toBePaginated();
    });

    test("fails when not given a paginated response", () => {
        delete response.data.meta.pageCount;
        expect(expect(response).toBePaginated).toThrowError(/Expected .* to be a paginated response/);
    });
});
