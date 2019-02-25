import axios from "axios";
import "jest-extended";

function request(method, path, params = {}) {
    const url = `http://localhost:4004/api/${path}`;
    const instance = axios[method.toLowerCase()];

    return ["GET", "DELETE"].includes(method) ? instance(url, { params }) : instance(url, params);
}

function expectJson(response) {
    expect(response.data).toBeObject();
}

function expectStatus(response, code) {
    expect(response.status).toBe(code);
}

function expectResource(response) {
    expect(response.data.data).toBeObject();
}

function expectCollection(response) {
    expect(Array.isArray(response.data.data)).toBe(true);
}

function expectPaginator(response, firstPage = true) {
    expect(response.data.meta).toBeObject();
    expect(response.data.meta).toHaveProperty("count");
    expect(response.data.meta).toHaveProperty("pageCount");
    expect(response.data.meta).toHaveProperty("totalCount");
    expect(response.data.meta).toHaveProperty("next");
    expect(response.data.meta).toHaveProperty("previous");
    expect(response.data.meta).toHaveProperty("self");
    expect(response.data.meta).toHaveProperty("first");
    expect(response.data.meta).toHaveProperty("last");
}

function expectSuccessful(response, statusCode = 200) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
}

function expectError(response, statusCode = 404) {
    this.expectStatus(response, statusCode);
    this.expectJson(response);
    expect(response.data.statusCode).toBeNumber();
    expect(response.data.error).toBeString();
    expect(response.data.message).toBeString();
}

export {
    request,
    expectJson,
    expectStatus,
    expectResource,
    expectCollection,
    expectPaginator,
    expectSuccessful,
    expectError,
};
